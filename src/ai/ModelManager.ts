import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

interface ChatMessage {
  role: "user" | "model" | "assistant";
  text: string;
}

export class ModelManager {
  private static MAX_RETRIES = 3;
  private static INITIAL_BACKOFF = 1000; // 1 second

  private static geminiModels = [
    "gemini-3.5-flash"
  ];

  private static async safeParseJson(res: Response): Promise<any> {
    const contentType = res.headers.get("content-type");

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP error ${res.status}`);
    }

    if (!contentType?.includes("application/json")) {
      const text = await res.text();
      throw new Error(`Expected JSON but received: ${text}`);
    }

    return await res.json();
  }

  /**
   * Helper to execute async functions with exponential backoff for 429 & 503 errors.
   */
  private static async executeWithRetry<T>(fn: () => Promise<T>, endpointLabel: string = "AI Model"): Promise<T> {
    let attempts = 0;
    const startTime = Date.now();
    
    while (attempts < this.MAX_RETRIES) {
      try {
        const result = await fn();
        return result;
      } catch (err: any) {
        attempts++;
        const executionTime = Date.now() - startTime;
        const status = err.status || (err.message && err.message.includes("429") ? 429 : err.message && err.message.includes("503") ? 503 : null);
        
        console.error(`[ACT_LOG] API Request Failed:
  Endpoint: ${endpointLabel}
  Error: ${err.message}
  Status Code: ${status || "Unknown"}
  Execution Time: ${executionTime}ms
  Attempt: ${attempts}/${this.MAX_RETRIES}`);

        if ((status === 429 || status === 503) && attempts < this.MAX_RETRIES) {
          const delay = this.INITIAL_BACKOFF * Math.pow(2, attempts - 1);
          console.warn(`[ModelManager] Retrying after error (${status}). Waiting ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw err;
        }
      }
    }
    throw new Error("Max retries exceeded.");
  }

  private static getGeminiModelsToTry(selectedModel: string): string[] {
    let primaryModel = "gemini-3.5-flash";
    if (selectedModel === "Gemini Pro" || selectedModel === "gemini-2.5-pro") {
      primaryModel = "gemini-2.5-pro";
    }
    return [primaryModel, ...this.geminiModels.filter(m => m !== primaryModel)];
  }

  private static parseKeys(customKey?: string): string[] {
    const keys: string[] = [];
    if (customKey) {
      customKey.split(',').map(k => k.trim()).filter(k => k).forEach(k => keys.push(k));
    }
    if (process.env.GEMINI_API_KEY) {
      process.env.GEMINI_API_KEY.split(',').map(k => k.trim()).filter(k => k).forEach(k => {
        if (!keys.includes(k)) keys.push(k);
      });
    }
    return keys;
  }

  // ---- PROVIDER EXECUTORS ----

  private static async executeCohereContent(prompt: string, systemPrompt: string, cohereKey: string, filePart?: any): Promise<{ text: string; modelUsed: string }> {
    return this.executeWithRetry(async () => {
      const res = await fetch("https://api.cohere.ai/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cohereKey}`
        },
        body: JSON.stringify({
          message: filePart ? `${prompt}\n\n[Attached document extraction processed by system]` : prompt,
          model: "command-r-plus",
          preamble: systemPrompt
        })
      });
      const data = await this.safeParseJson(res);
      if (data.text) {
        return { text: data.text, modelUsed: "Command R+ (Cohere)" };
      }
      throw new Error(data.message || "Cohere chat generation failed.");
    }, "Cohere Command A+");
  }

  private static async executeOpenAIContent(prompt: string, systemPrompt: string, openAIKey: string, filePart?: any): Promise<{ text: string; modelUsed: string }> {
    return this.executeWithRetry(async () => {
      let messagesPayload: any[] = [{ role: "system", content: systemPrompt }];

      if (filePart) {
        const isImage = filePart.mimeType.startsWith("image/");
        if (isImage) {
          messagesPayload.push({
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: filePart.fileUrl ? filePart.fileUrl : `data:${filePart.mimeType};base64,${filePart.data}`
                }
              }
            ]
          });
        } else {
          messagesPayload.push({
            role: "user",
            content: `${prompt}\n\n[File Data (${filePart.mimeType}) attached ${filePart.fileUrl ? "from " + filePart.fileUrl : "as Base64"}]`
          });
        }
      } else {
        messagesPayload.push({ role: "user", content: prompt });
      }

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openAIKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: messagesPayload,
          temperature: 0.7
        })
      });
      const data = await this.safeParseJson(res);
      if (data.choices && data.choices.length > 0) {
        return { text: data.choices[0].message.content, modelUsed: "GPT-4o (OpenAI)" };
      }
      throw new Error(data.error?.message || "OpenAI generation failed.");
    }, "OpenAI GPT-4o-mini");
  }

  private static async executeZaiContent(prompt: string, systemPrompt: string, zaiKey: string, filePart?: any): Promise<{ text: string; modelUsed: string }> {
    return this.executeWithRetry(async () => {
      let messagesPayload: any[] = [{ role: "system", content: systemPrompt }];

      if (filePart) {
        messagesPayload.push({
          role: "user",
          content: `${prompt}\n\n[File Data (${filePart.mimeType}) attached ${filePart.fileUrl ? "from " + filePart.fileUrl : "as Base64"}]`
        });
      } else {
        messagesPayload.push({ role: "user", content: prompt });
      }

      const res = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${zaiKey}`
        },
        body: JSON.stringify({
          model: "glm-4-plus",
          messages: messagesPayload,
          temperature: 0.7
        })
      });
      const data = await this.safeParseJson(res);
      if (data.choices && data.choices.length > 0) {
        return { text: data.choices[0].message.content, modelUsed: "GLM-4-Plus (Z.ai)" };
      }
      throw new Error(data.error?.message || "Z.ai generation failed.");
    }, "Z.ai GLM-4-Plus");
  }

  public static async generateContent(
    prompt: string,
    systemPrompt: string,
    apiKey?: string,
    selectedModel: string = "Gemini Pro",
    filePart?: { data?: string; mimeType: string; fileUrl?: string },
    openaiKey?: string,
    cohereKey?: string,
    zaiKey?: string
  ): Promise<{ text: string; modelUsed: string }> {
    const activeKey = apiKey || process.env.GEMINI_API_KEY;
    const openAIKey = openaiKey || process.env.OPENAI_API_KEY;
    const resolvedCohereKey = cohereKey || process.env.COHERE_API_KEY;
    const resolvedZaiKey = zaiKey || process.env.Z_AI_API_KEY;

    let lastError: any = null;

    if (selectedModel.includes("Z.ai")) {
      if (!resolvedZaiKey) throw new Error("No Z.ai API key supplied in Settings.");
      return this.executeZaiContent(prompt, systemPrompt, resolvedZaiKey, filePart);
    }

    if (selectedModel.includes("Cohere")) {
      if (!resolvedCohereKey) throw new Error("No Cohere API key supplied in Settings.");
      return this.executeCohereContent(prompt, systemPrompt, resolvedCohereKey, filePart);
    }

    if (selectedModel.includes("GPT")) {
      if (!openAIKey) throw new Error("No OpenAI API key supplied in Settings.");
      return this.executeOpenAIContent(prompt, systemPrompt, openAIKey, filePart);
    }

    // Gemini Path
    const availableKeys = this.parseKeys(activeKey);
    if (availableKeys.length > 0) {
      const modelsToTry = this.getGeminiModelsToTry(selectedModel);
      let resolvedFilePartPayload: any = null;
      if (filePart) {
        if (filePart.fileUrl) {
          let uploaded = false;
          for (let keyIdx = 0; keyIdx < availableKeys.length; keyIdx++) {
            try {
              const fileManager = new GoogleAIFileManager(availableKeys[keyIdx]);
              const uploadResponse = await fileManager.uploadFile(filePart.fileUrl, {
                mimeType: filePart.mimeType,
                displayName: `ACT_Upload_${Date.now()}`
              });
              resolvedFilePartPayload = {
                fileData: {
                  fileUri: uploadResponse.file.uri,
                  mimeType: uploadResponse.file.mimeType
                }
              };
              uploaded = true;
              break;
            } catch (uploadErr) {
              console.warn(`[ACT_LOG] File Upload failed on key index ${keyIdx}`, uploadErr);
            }
          }
          if (!uploaded) throw new Error("Failed to upload file to Gemini File API across all keys.");
        } else if (filePart.data) {
          resolvedFilePartPayload = {
            inlineData: {
              data: filePart.data,
              mimeType: filePart.mimeType
            }
          };
        }
      }

      for (const modelName of modelsToTry) {
        for (let keyIdx = 0; keyIdx < availableKeys.length; keyIdx++) {
          const currentKey = availableKeys[keyIdx];
          const genAI = new GoogleGenerativeAI(currentKey);
          try {
            const result = await this.executeWithRetry(async () => {
              const aiModel = genAI.getGenerativeModel({ model: modelName, systemInstruction: systemPrompt });
              if (resolvedFilePartPayload) {
                const res = await aiModel.generateContent([prompt, resolvedFilePartPayload]);
                return res.response.text();
              } else {
                const res = await aiModel.generateContent(prompt);
                return res.response.text();
              }
            }, `Gemini (${modelName}) [Key ${keyIdx}]`);
            
            if (result) return { text: result, modelUsed: modelName };
          } catch (err: any) {
            console.error(`[ModelManager] Model ${modelName} on key index ${keyIdx} failed: ${err.message}. Rotating...`);
            lastError = err;
          }
        }
      }
    } else {
      lastError = new Error("No Gemini API key supplied in Settings.");
    }

    // OpenAI Fallback if Gemini fails
    if (openAIKey) {
      console.warn("[ACT_LOG] Gemini failed. Attempting OpenAI Fallback...");
      try {
        const result = await this.executeOpenAIContent(prompt, systemPrompt, openAIKey, filePart);
        result.modelUsed += " (Fallback)";
        return result;
      } catch (err: any) {
        console.error(`[ModelManager] OpenAI Fallback failed: ${err.message}`);
        lastError = err;
      }
    }

    // Cohere Fallback if OpenAI fails
    if (resolvedCohereKey) {
      console.warn("[ACT_LOG] OpenAI Fallback failed. Attempting Cohere Fallback...");
      try {
        const result = await this.executeCohereContent(prompt, systemPrompt, resolvedCohereKey, filePart);
        result.modelUsed += " (Fallback)";
        return result;
      } catch (err: any) {
        console.error(`[ModelManager] Cohere Fallback failed: ${err.message}`);
        lastError = err;
      }
    }

    console.error("[ACT_LOG] All AI providers (Gemini/OpenAI/Cohere) failed to respond.");
    throw new Error("AI service is temporarily unavailable. Please try again later or configure another API key.");
  }



  /**
   * Safe chat session runner with fallback and retries.
   */
  private static async executeCohereChat(messages: any[], systemPrompt: string, cohereKey: string): Promise<{ text: string; modelUsed: string }> {
    const userMessage = messages[messages.length - 1]?.text || "";
    const history = messages.slice(0, -1);
    return this.executeWithRetry(async () => {
      const cohereHistory = history.map(m => ({
        role: m.role === "user" ? "USER" : "CHATBOT",
        message: m.text
      }));
      const res = await fetch("https://api.cohere.ai/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cohereKey}`
        },
        body: JSON.stringify({
          message: userMessage,
          model: "command-r-plus",
          preamble: systemPrompt,
          chat_history: cohereHistory
        })
      });
      const data = await this.safeParseJson(res);
      if (data.text) {
        return { text: data.text, modelUsed: "Command R+ (Cohere)" };
      }
      throw new Error(data.message || "Cohere chat failed.");
    });
  }

  private static async executeOpenAIChat(messages: any[], systemPrompt: string, openAIKey: string): Promise<{ text: string; modelUsed: string }> {
    const userMessage = messages[messages.length - 1]?.text || "";
    const history = messages.slice(0, -1);
    return this.executeWithRetry(async () => {
      const openAIMessages = [
        { role: "system", content: systemPrompt },
        ...history.map(m => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.text
        })),
        { role: "user", content: userMessage }
      ];

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openAIKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: openAIMessages,
          temperature: 0.7
        })
      });
      const data = await this.safeParseJson(res);
      if (data.choices && data.choices.length > 0) {
        return { text: data.choices[0].message.content, modelUsed: "GPT-4o (OpenAI)" };
      }
      throw new Error(data.error?.message || "OpenAI chat failed.");
    });
  }

  private static async executeZaiChat(messages: any[], systemPrompt: string, zaiKey: string): Promise<{ text: string; modelUsed: string }> {
    const userMessage = messages[messages.length - 1]?.text || "";
    const history = messages.slice(0, -1);
    return this.executeWithRetry(async () => {
      const zaiMessages = [
        { role: "system", content: systemPrompt },
        ...history.map(m => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.text
        })),
        { role: "user", content: userMessage }
      ];

      const res = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${zaiKey}`
        },
        body: JSON.stringify({
          model: "glm-4-plus",
          messages: zaiMessages,
          temperature: 0.7
        })
      });
      const data = await this.safeParseJson(res);
      if (data.choices && data.choices.length > 0) {
        return { text: data.choices[0].message.content, modelUsed: "GLM-4-Plus (Z.ai)" };
      }
      throw new Error(data.error?.message || "Z.ai chat failed.");
    });
  }

  public static async generateChatResponse(
    messages: any[],
    systemPrompt: string,
    apiKey?: string,
    selectedModel: string = "Gemini Pro",
    openaiKey?: string,
    cohereKey?: string,
    zaiKey?: string
  ): Promise<{ text: string; modelUsed: string }> {
    const openAIKey = openaiKey || process.env.OPENAI_API_KEY;
    const resolvedCohereKey = cohereKey || process.env.COHERE_API_KEY;
    const activeKey = apiKey || process.env.GEMINI_API_KEY;
    const resolvedZaiKey = zaiKey || process.env.Z_AI_API_KEY;

    let lastError: any = null;

    if (selectedModel.includes("Z.ai")) {
      if (!resolvedZaiKey) throw new Error("No Z.ai API key supplied in Settings.");
      return this.executeZaiChat(messages, systemPrompt, resolvedZaiKey);
    }

    if (selectedModel.includes("Cohere")) {
      if (!resolvedCohereKey) throw new Error("No Cohere API key supplied in Settings.");
      return this.executeCohereChat(messages, systemPrompt, resolvedCohereKey);
    }

    if (selectedModel.includes("GPT")) {
      if (!openAIKey) throw new Error("No OpenAI API key supplied in Settings.");
      return this.executeOpenAIChat(messages, systemPrompt, openAIKey);
    }

    // Gemini Path
    const availableKeys = this.parseKeys(activeKey);
    if (availableKeys.length > 0) {
      const modelsToTry = this.getGeminiModelsToTry(selectedModel);
      const geminiHistory = messages.slice(0, -1).map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      }));
      const lastUserMessage = messages[messages.length - 1]?.text || "";

      for (const modelName of modelsToTry) {
        for (let keyIdx = 0; keyIdx < availableKeys.length; keyIdx++) {
          const currentKey = availableKeys[keyIdx];
          const genAI = new GoogleGenerativeAI(currentKey);
          try {
            const result = await this.executeWithRetry(async () => {
              const aiModel = genAI.getGenerativeModel({ model: modelName, systemInstruction: systemPrompt });
              const chat = aiModel.startChat({
                history: geminiHistory,
                generationConfig: { maxOutputTokens: 8192 },
              });
              const res = await chat.sendMessage(lastUserMessage);
              return res.response.text();
            }, `Gemini Chat (${modelName}) [Key ${keyIdx}]`);
            
            if (result) return { text: result, modelUsed: modelName };
          } catch (err: any) {
            console.error(`[ModelManager] Chat Model ${modelName} on key index ${keyIdx} failed: ${err.message}. Rotating...`);
            lastError = err;
          }
        }
      }
    } else {
      lastError = new Error("No Gemini API key supplied in Settings.");
    }

    // OpenAI Fallback if Gemini fails
    if (openAIKey) {
      console.warn("[ACT_LOG] Gemini chat failed. Attempting OpenAI Fallback...");
      try {
        const result = await this.executeOpenAIChat(messages, systemPrompt, openAIKey);
        result.modelUsed += " (Fallback)";
        return result;
      } catch (err: any) {
        console.error(`[ModelManager] OpenAI Chat Fallback failed: ${err.message}`);
        lastError = err;
      }
    }

    // Cohere Fallback if OpenAI fails
    if (resolvedCohereKey) {
      console.warn("[ACT_LOG] OpenAI Chat Fallback failed. Attempting Cohere Fallback...");
      try {
        const result = await this.executeCohereChat(messages, systemPrompt, resolvedCohereKey);
        result.modelUsed += " (Fallback)";
        return result;
      } catch (err: any) {
        console.error(`[ModelManager] Cohere Chat Fallback failed: ${err.message}`);
        lastError = err;
      }
    }

    console.error("[ACT_LOG] All AI providers (Gemini/OpenAI/Cohere) failed to respond for chat.");
    throw new Error("AI service is temporarily unavailable. Please try again later or configure another API key.");
  }



  /**
   * Centralized embedding logic for RAG pipelines.
   */
  public static async getEmbeddings(
    texts: string[],
    apiKey?: string,
    openaiKey?: string,
    cohereKey?: string
  ): Promise<number[][]> {
    const activeKey = apiKey || process.env.GEMINI_API_KEY;
    const openAIKey = openaiKey || process.env.OPENAI_API_KEY;
    const resolvedCohereKey = cohereKey || process.env.COHERE_API_KEY;

    let lastError: any = null;

    // Try Gemini first if key available
    const useGemini = activeKey && (activeKey.startsWith("AIza") || activeKey.startsWith("AQ."));
    if (useGemini) {
      try {
        const genAI = new GoogleGenerativeAI(activeKey as string);
        const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

        const embeddings: number[][] = [];
        for (const text of texts) {
          if (!text.trim()) {
            embeddings.push(new Array(768).fill(0));
            continue;
          }
          const result = await this.executeWithRetry(async () => {
            const res = await embedModel.embedContent(text);
            return res.embedding.values;
          });
          embeddings.push(result);
        }
        return embeddings;
      } catch (err: any) {
        console.error("[ModelManager] Gemini embeddings failed:", err.message);
        lastError = err;
      }
    }

    // Try OpenAI next if key available
    if (openAIKey) {
      try {
        return await this.executeWithRetry(async () => {
          const res = await fetch("https://api.openai.com/v1/embeddings", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${openAIKey}`
            },
            body: JSON.stringify({
              input: texts,
              model: "text-embedding-3-small"
            })
          });
          const data = await this.safeParseJson(res);
          if (data.data) {
            return data.data.map((item: any) => item.embedding);
          }
          throw new Error(data.error?.message || "OpenAI Embeddings failed.");
        });
      } catch (err: any) {
        console.error("[ModelManager] OpenAI embeddings failed:", err.message);
        lastError = err;
      }
    }

    // Fall back to Cohere if key available
    if (resolvedCohereKey) {
      try {
        return await this.executeWithRetry(async () => {
          const res = await fetch("https://api.cohere.ai/v1/embed", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${resolvedCohereKey}`
            },
            body: JSON.stringify({
              texts: texts,
              model: "embed-english-v3.0",
              input_type: "search_document"
            })
          });
          const data = await this.safeParseJson(res);
          if (data.embeddings) {
            return data.embeddings;
          }
          throw new Error(data.message || "Cohere Embeddings failed.");
        });
      } catch (err: any) {
        console.error("[ModelManager] Cohere embeddings failed:", err.message);
        lastError = err;
      }
    }

    throw lastError || new Error("All embedding providers failed.");
  }
}
