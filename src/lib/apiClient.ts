interface ChatPayload {
  messages: { role: string; content: string }[];
  files: any[];
  model: string;
  apiKey: string | null;
  openaiKey?: string | null;
  cohereKey?: string | null;
  useRAG: boolean;
}

interface TransformPayload {
  text?: string;
  fileData?: string;
  fileName?: string;
  fileType?: string;
  format: string;
  model: string;
  apiKey: string | null;
  openaiKey?: string | null;
  cohereKey?: string | null;
}

export class ApiClient {
  private static activeControllers = new Map<string, AbortController>();
  private static requestCache = new Map<string, any>();
  private static queue: Promise<any> = Promise.resolve();

  /**
   * Helper to normalize raw backend/network errors into human-friendly messages.
   */
  private static parseError(err: any): string {
    const msg = err.message || "";
    if (msg.includes("Quota exceeded") || msg.includes("quota") || msg.includes("429")) {
      return "AI API quota exceeded. Please check your billing details or retry in a few seconds.";
    }
    if (msg.includes("503") || msg.includes("Unavailable") || msg.includes("overloaded")) {
      return "AI model is temporarily busy. We are retrying, but please try again if the issue persists.";
    }
    if (msg.includes("404") || msg.includes("not found")) {
      return "Selected AI model is currently unsupported or unavailable for this API key.";
    }
    if (msg.includes("Invalid value") || msg.includes("system_instruction") || msg.includes("400")) {
      return "An invalid payload structure was submitted. The prompt format has been adjusted, please try again.";
    }
    return msg || "Unable to generate content at this time. Please check your connection.";
  }

  /**
   * Safe fetch request helper with abort controller mapping.
   */
  private static async request(url: string, payload: any, key: string, timeoutMs = 45000): Promise<any> {
    // Cancel any ongoing request of the same type (prevents duplicate triggers)
    if (this.activeControllers.has(key)) {
      this.activeControllers.get(key)?.abort();
      console.warn(`[apiClient] Aborted duplicate ongoing request for ${key}`);
    }

    const controller = new AbortController();
    this.activeControllers.set(key, controller);

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      this.activeControllers.delete(key);

      const contentType = res.headers.get("content-type");

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      if (!contentType?.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Expected JSON but received: ${text}`);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Request failed.");
      }
      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);
      this.activeControllers.delete(key);

      if (err.name === "AbortError") {
        throw new Error("Request took too long and timed out. Please try again.");
      }
      throw new Error(this.parseError(err));
    }
  }

  public static async postChat(payload: ChatPayload): Promise<any> {
    return this.request("/api/chat", payload, "chat");
  }

  public static async postTransform(payload: TransformPayload): Promise<any> {
    return this.request("/api/transform", payload, "transform");
  }

  /**
   * Stream API request helper to process Server-Sent Events (SSE) or chunked JSON.
   */
  public static async streamTransform(
    payload: TransformPayload,
    onProgress: (data: any) => void
  ): Promise<any> {
    const key = "transform_stream";
    const payloadHash = JSON.stringify(payload);

    // 6. Cache identical requests to avoid unnecessary API calls
    if (this.requestCache.has(payloadHash)) {
      onProgress({ type: "progress", stage: "Restoring from cache...", progress: 100 });
      return this.requestCache.get(payloadHash);
    }

    // 7. Cancel stale or duplicate requests using AbortController
    if (this.activeControllers.has(key)) {
      this.activeControllers.get(key)?.abort();
    }
    
    const controller = new AbortController();
    this.activeControllers.set(key, controller);

    // 5. Queue AI requests so they execute sequentially
    return new Promise((resolve, reject) => {
      this.queue = this.queue.then(async () => {
        if (controller.signal.aborted) {
          return reject(new Error("Request was aborted or timed out."));
        }

        try {
          const res = await fetch("/api/transform", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payloadHash,
            signal: controller.signal
          });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to transform content.");
      }

      if (!res.body) {
        throw new Error("ReadableStream not supported in this browser.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalOutput = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Split by newlines (assuming newline-delimited JSON chunks)
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep the last incomplete chunk in the buffer

        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const data = JSON.parse(line);
            
            if (data.type === "progress") {
              onProgress(data);
            } else if (data.type === "success") {
              finalOutput = data;
            } else if (data.type === "error") {
              throw new Error(data.error);
            }
          } catch (e: any) {
            if (e.name !== "SyntaxError") throw e;
          }
        }
      }

      this.activeControllers.delete(key);
      
      if (!finalOutput) {
        throw new Error("Stream closed without final success payload.");
      }
      
      // Save to cache
      this.requestCache.set(payloadHash, finalOutput);
      
      resolve(finalOutput);

    } catch (err: any) {
      this.activeControllers.delete(key);
      if (err.name === "AbortError") {
        reject(new Error("Request was aborted or timed out."));
      } else {
        reject(new Error(this.parseError(err)));
      }
    }
      }).catch(() => {}); // Catch queue errors internally to prevent unhandled rejections
    });
  }
}
