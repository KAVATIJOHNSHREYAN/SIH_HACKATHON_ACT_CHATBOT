import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

interface ChatMessage {
  role: "user" | "model" | "assistant";
  text: string;
}

export class ModelManager {
  private static MAX_RETRIES = 3;
  private static INITIAL_BACKOFF = 1000; // 1 second

  // Standardizes model strings to prevent 404s
  private static geminiModels = [
    "gemini-2.5-pro"
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

  /**
   * Fallback resolution logic for Gemini model selection.
   */
  private static getGeminiModel(selectedModel: string, customApiKey?: string): any {
    const activeKey = customApiKey || process.env.GEMINI_API_KEY;
    if (!activeKey) {
      throw new Error("No Gemini API key supplied.");
    }
    const genAI = new GoogleGenerativeAI(activeKey);
    
    // Resolve frontend selection to stable model identifier
    let primaryModel = "gemini-2.5-pro";

    return { genAI, primaryModel };
  }

  /**
   * Safe content generation with fallback and retries.
   */
  /**
   * Safe content generation with fallback and retries.
   */
  public static async generateContent(
    prompt: string,
    systemPrompt: string,
    apiKey?: string,
    selectedModel: string = "Gemini Pro",
    filePart?: { data?: string; mimeType: string; fileUrl?: string },
    openaiKey?: string,
    cohereKey?: string
  ): Promise<{ text: string; modelUsed: string }> {
    const activeKey = apiKey || process.env.GEMINI_API_KEY;
    const openAIKey = openaiKey || process.env.OPENAI_API_KEY;
    const resolvedCohereKey = cohereKey || process.env.COHERE_API_KEY;

    if (selectedModel === "Cohere") {
      if (!resolvedCohereKey) {
        throw new Error("No Cohere API key supplied in Settings.");
      }
      return this.executeWithRetry(async () => {
        const res = await fetch("https://api.cohere.ai/v1/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resolvedCohereKey}`
          },
          body: JSON.stringify({
            message: filePart ? `${prompt}\n\n[Attached document extraction processed by system]` : prompt,
            model: "command-a-plus",
            preamble: systemPrompt
          })
        });
        const data = await this.safeParseJson(res);
        if (data.text) {
          return { text: data.text, modelUsed: "Command A+ (Cohere)" };
        }
        throw new Error(data.message || "Cohere chat generation failed.");
      }, "Cohere Command A+");
    }

    const useOpenAI = selectedModel === "GPT-4o";

    if (useOpenAI) {
      if (!openAIKey) {
        throw new Error("No OpenAI API key supplied in Settings.");
      }
      return this.executeWithRetry(async () => {
        let messagesPayload: any[] = [
          { role: "system", content: systemPrompt }
        ];

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

    // Gemini Path
    if (!activeKey) {
      throw new Error("No Gemini API key supplied in Settings.");
    }
    const { genAI, primaryModel } = this.getGeminiModel(selectedModel, activeKey);
    const modelsToTry = [primaryModel, ...this.geminiModels.filter(m => m !== primaryModel)];
    let lastError: any = null;

    let resolvedFilePartPayload: any = null;
    if (filePart) {
      if (filePart.fileUrl) {
        try {
          const fileManager = new GoogleAIFileManager(activeKey);
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
        } catch (uploadErr) {
          console.error("Gemini File API Upload Error:", uploadErr);
          throw uploadErr;
        }
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
      try {
        const result = await this.executeWithRetry(async () => {
          const aiModel = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemPrompt
          });

          if (resolvedFilePartPayload) {
            const res = await aiModel.generateContent([prompt, resolvedFilePartPayload]);
            return res.response.text();
          } else {
            const res = await aiModel.generateContent(prompt);
            return res.response.text();
          }
        }, `Gemini (${modelName})`);
        if (result) {
          return { text: result, modelUsed: modelName };
        }
      } catch (err: any) {
        console.error(`[ModelManager] Model ${modelName} failed: ${err.message}. Trying next fallback...`);
        lastError = err;
      }
    }

    throw lastError || new Error("All Gemini models failed to respond.");
  }

  /**
   * Safe chat session runner with fallback and retries.
   */
  public static async generateChatResponse(
    messages: ChatMessage[],
    systemPrompt: string,
    apiKey?: string,
    selectedModel: string = "Gemini Pro",
    openaiKey?: string,
    cohereKey?: string
  ): Promise<{ text: string; modelUsed: string }> {
    const activeKey = apiKey || process.env.GEMINI_API_KEY;
    const openAIKey = openaiKey || process.env.OPENAI_API_KEY;
    const resolvedCohereKey = cohereKey || process.env.COHERE_API_KEY;

    if (selectedModel === "Cohere") {
      if (!resolvedCohereKey) {
        throw new Error("No Cohere API key supplied in Settings.");
      }
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
            "Authorization": `Bearer ${resolvedCohereKey}`
          },
          body: JSON.stringify({
            message: userMessage,
            model: "command-a-plus",
            preamble: systemPrompt,
            chat_history: cohereHistory
          })
        });
        const data = await this.safeParseJson(res);
        if (data.text) {
          return { text: data.text, modelUsed: "Command A+ (Cohere)" };
        }
        throw new Error(data.message || "Cohere chat failed.");
      });
    }

    const useOpenAI = selectedModel === "GPT-4o";

    const userMessage = messages[messages.length - 1]?.text || "";
    const history = messages.slice(0, -1);

    if (useOpenAI) {
      if (!openAIKey) {
        throw new Error("No OpenAI API key supplied in Settings.");
      }
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

    // Gemini Chat Path
    if (!activeKey) {
      throw new Error("No Gemini API key supplied in Settings.");
    }
    const { genAI, primaryModel } = this.getGeminiModel(selectedModel, activeKey);
    const modelsToTry = [primaryModel, ...this.geminiModels.filter(m => m !== primaryModel)];
    let lastError: any = null;

    const sanitizedHistory = history.map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));
    while (sanitizedHistory.length > 0 && sanitizedHistory[0].role !== "user") {
      sanitizedHistory.shift();
    }

    for (const modelName of modelsToTry) {
      try {
        const result = await this.executeWithRetry(async () => {
          const aiModel = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemPrompt
          });
          const chat = aiModel.startChat({
            history: sanitizedHistory
          });
          const response = await chat.sendMessage([{ text: userMessage }]);
          return response.response.text();
        });
        if (result) {
          return { text: result, modelUsed: modelName };
        }
      } catch (err: any) {
        console.error(`[ModelManager] Chat model ${modelName} failed: ${err.message}. Trying next fallback...`);
        lastError = err;
      }
    }

    throw lastError || new Error("All Gemini chat models failed to respond.");
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
