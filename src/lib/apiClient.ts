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

      const data = await res.json();
      if (!res.ok || !data.success) {
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
}
