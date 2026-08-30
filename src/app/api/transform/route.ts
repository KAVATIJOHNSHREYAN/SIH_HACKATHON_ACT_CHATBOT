import { NextRequest } from "next/server";
import mammoth from "mammoth";
import { ModelManager } from "@/ai/ModelManager";

export const maxDuration = 300; // Allow Vercel execution up to 5 minutes
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendData = (data: any) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
        } catch (e) {
          console.error("Stream closed before enqueue", e);
        }
      };

      const requestId = Math.random().toString(36).substring(2, 15);
      console.log("========== ACT REQUEST START ==========");
      console.log(`[${requestId}] 1. Request received`);
      console.time(`ACT_REQUEST_${requestId}`);

      try {
        console.time(`Parse_Input_${requestId}`);
        const { 
          text, fileData, fileUrl, fileName, fileType, format, model, apiKey, openaiKey, cohereKey,
          targetFormats, audience, tone, language, detailLevel, communicationObjective, contentStyle 
        } = await req.json();

        console.timeEnd(`Parse_Input_${requestId}`);
        console.log(`[${requestId}] 2. File uploaded successfully / Data parsed`);
        console.log(`[${requestId}] 3. Validating input`);
        
        let extractedText = "";

        // 1. CONTENT EXTRACTION PORTAL
        console.log(`[${requestId}] 4. Starting PDF/Text/Image processing`);
        console.time(`Content_Extraction_${requestId}`);
        console.log(`[${requestId}] 5. Content extraction started`);
        sendData({ type: "progress", stage: "Extracting content...", progress: 20 });
        
        if (fileData || fileUrl) {
          let fileBuffer: Buffer | null = null;
          let base64Content = "";

          if (fileData) {
            const commaIndex = fileData.indexOf(",");
            base64Content = commaIndex !== -1 ? fileData.slice(commaIndex + 1) : fileData;
            fileBuffer = Buffer.from(base64Content, "base64");
          }

          if (fileBuffer && (fileType?.includes("officedocument.wordprocessingml") || fileName?.endsWith(".docx"))) {
            const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
            extractedText = docxResult.value;
          } else {
            const activeKey = apiKey || process.env.GEMINI_API_KEY;
            const openAIKey = openaiKey || process.env.OPENAI_API_KEY;
            const resolvedCohereKey = cohereKey || process.env.COHERE_API_KEY;
            
            if (!activeKey && !openAIKey && !resolvedCohereKey) {
              throw new Error("No API keys supplied in Settings or Environment. Please configure an API key.");
            } else {
              sendData({ type: "progress", stage: "Running OCR & Vision Analysis...", progress: 40 });
              
              const extractionPrompt = `You are a document content extraction service.
Extract all selectable text, perform layout analysis, run OCR on images or scanned pages, and transcribe audio content from the provided file.
Return ONLY the raw extracted document content. Do not summarize or answer queries yet.`;

              const filePart = {
                data: base64Content || undefined,
                fileUrl: fileUrl || undefined,
                mimeType: fileType || "application/pdf"
              };

              const { text } = await ModelManager.generateContent(
                extractionPrompt,
                "You are a document content extraction backend.",
                activeKey || undefined,
                model,
                filePart,
                openAIKey || undefined,
                resolvedCohereKey || undefined
              );
              extractedText = text;
            }
          }
        } else {
          extractedText = text;
        }

        if (!extractedText) {
          throw new Error("Extraction pipeline yielded empty content.");
        }

        console.log(`[${requestId}] 6. Content extraction completed`);
        console.timeEnd(`Content_Extraction_${requestId}`);
        console.log(`[${requestId}] Metadata: File: ${fileName || "N/A"}, Type: ${fileType || "N/A"}, Size (Base64): ${fileData ? fileData.length : "N/A"}, Extracted Text Length: ${extractedText.length}`);

        sendData({ type: "progress", stage: "Analyzing extracted text...", progress: 60 });

        // 2. AI MODEL PROCESSING PORTAL
        const activeKey = apiKey || process.env.GEMINI_API_KEY;
        const openAIKey = openaiKey || process.env.OPENAI_API_KEY;
        const resolvedCohereKey = cohereKey || process.env.COHERE_API_KEY;

        if (!activeKey && !openAIKey && !resolvedCohereKey) {
          throw new Error("No API keys configured. AI service is temporarily unavailable. Please try again later or configure another API key.");
        }

        const isMultiFormat = targetFormats && Array.isArray(targetFormats) && targetFormats.length > 0;
        const formatInstruction = isMultiFormat
          ? `You must transform the provided extracted document text into ALL of the following requested formats: ${targetFormats.join(", ")}.\nSeparate each output section clearly using Markdown headings (e.g. # Summary, # FAQ, etc.).`
          : `You must transform the provided extracted document text into the following target format: "${format}".`;

        const audienceInstruction = audience ? `\nTarget Audience: ${audience}` : "";
        const toneInstruction = tone ? `\nTone: ${tone}` : "";
        const languageInstruction = language && language !== "Auto Detect" ? `\nLanguage: ${language}` : "";
        const detailInstruction = detailLevel ? `\nDetail Level: ${detailLevel}` : "";
        const objectiveInstruction = communicationObjective ? `\nCommunication Objective: ${communicationObjective}` : "";
        const styleInstruction = contentStyle ? `\nContent Style: ${contentStyle}` : "";

        console.log(`[${requestId}] 7. Building AI prompt`);
        const CHUNK_SIZE = 60000; // ~15,000 tokens
        let outputText = "";
        let finalModelUsed = "Unknown";
        
        // Chunking Logic
        if (extractedText.length > CHUNK_SIZE) {
        console.log(`[${requestId}] 8. Prompt size: Chunked (Text Length: ${extractedText.length})`);
          
          let provider = "Gemini";
          if (model.includes("GPT")) provider = "OpenAI";
          if (model.includes("Cohere")) provider = "Cohere";
          if (model.includes("Z.ai")) provider = "Z.ai";
          console.log("Provider:", provider);
          console.log("Model:", model);
          console.log("Gemini Key:", !!process.env.GEMINI_API_KEY);
          console.log("OpenAI Key:", !!process.env.OPENAI_API_KEY);
          console.log("Cohere Key:", !!process.env.COHERE_API_KEY);
          console.log("Z.ai Key:", !!process.env.Z_AI_API_KEY);

          console.log(`[${requestId}] 9. Sending request to ${provider} (Chunked processing)`);
          console.log(`[${requestId}] 10. Waiting for ${provider} response...`);
          console.time(`AI_Generation_${requestId}`);
          
          const numChunks = Math.ceil(extractedText.length / CHUNK_SIZE);
          for (let i = 0; i < numChunks; i++) {
            sendData({ type: "progress", stage: `Generating AI Transformation (Part ${i + 1}/${numChunks})...`, progress: 75 + Math.floor((i/numChunks)*20) });
            
            const chunkText = extractedText.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
            const chunkPrompt = `You are ACT (AI Content Transformation Assistant), an enterprise-grade content transformation engine.
${formatInstruction}
${audienceInstruction}${toneInstruction}${languageInstruction}${detailInstruction}${objectiveInstruction}${styleInstruction}

Ensure the output is high-quality and styled in clean Markdown. This is part ${i + 1} of ${numChunks} of a large document.

Extracted Document Content Part ${i + 1}:
"""
${chunkText}
"""
`;
            
            const keepAlive = setInterval(() => {
              sendData({ type: "progress", stage: `Generating AI Transformation (Part ${i + 1}/${numChunks})...`, progress: 75 + Math.floor((i/numChunks)*20) });
            }, 5000);

            const { text: chunkOutput, modelUsed } = await ModelManager.generateContent(
              chunkPrompt,
              "You are ACT (AI Content Transformation Assistant), an enterprise-grade content transformation engine.",
              activeKey || undefined,
              model,
              undefined,
              openAIKey || undefined,
              resolvedCohereKey || undefined,
              process.env.Z_AI_API_KEY || undefined
            );
            
            clearInterval(keepAlive);
            
            outputText += (i > 0 ? "\n\n---\n\n" : "") + chunkOutput;
            finalModelUsed = modelUsed;
          }
          console.log(`[${requestId}] 11. Gemini response received (All chunks)`);
          console.timeEnd(`AI_Generation_${requestId}`);
        } else {
          const prompt = `You are ACT (AI Content Transformation Assistant), an enterprise-grade content transformation engine.
${formatInstruction}
${audienceInstruction}${toneInstruction}${languageInstruction}${detailInstruction}${objectiveInstruction}${styleInstruction}

Ensure the output is high-quality and styled in clean Markdown. For specific formats like Video Package, Infographic, Presentation, Advisory, or Executive Summary, use structured sections (Title, Script, Slides, Recommendations, etc.) as appropriate.

Extracted Document Content:
"""
${extractedText}
"""
`;

          sendData({ type: "progress", stage: "Generating AI Transformation...", progress: 75 });
          
          const keepAlive = setInterval(() => {
            sendData({ type: "progress", stage: "Generating AI Transformation...", progress: 75 });
          }, 5000);

          console.log(`[${requestId}] 8. Prompt size: Full (Text Length: ${extractedText.length})`);

          let provider = "Gemini";
          if (model.includes("GPT")) provider = "OpenAI";
          if (model.includes("Cohere")) provider = "Cohere";
          if (model.includes("Z.ai")) provider = "Z.ai";
          console.log("Provider:", provider);
          console.log("Model:", model);
          console.log("Gemini Key:", !!process.env.GEMINI_API_KEY);
          console.log("OpenAI Key:", !!process.env.OPENAI_API_KEY);
          console.log("Cohere Key:", !!process.env.COHERE_API_KEY);
          console.log("Z.ai Key:", !!process.env.Z_AI_API_KEY);

          console.log(`[${requestId}] 9. Sending request to ${provider} (Full processing)`);
          console.log(`[${requestId}] 10. Waiting for ${provider} response...`);
          console.time(`AI_Generation_${requestId}`);

          const res = await ModelManager.generateContent(
            prompt,
            "You are ACT (AI Content Transformation Assistant), an enterprise-grade content transformation engine.",
            activeKey || undefined,
            model,
            undefined,
            openAIKey || undefined,
            resolvedCohereKey || undefined,
            process.env.Z_AI_API_KEY || undefined
          );
          
          console.log(`[${requestId}] 11. Gemini response received`);
          console.timeEnd(`AI_Generation_${requestId}`);
          
          clearInterval(keepAlive);
          
          outputText = res.text;
          finalModelUsed = res.modelUsed;
        }

        console.log(`[${requestId}] 12. Parsing AI response`);
        console.log(`[${requestId}] 13. Formatting output`);
        
        sendData({ type: "progress", stage: "Finalizing Output...", progress: 95 });

        console.log(`[${requestId}] 14. Generating final deliverable`);
        console.log(`[${requestId}] 15. Sending response to frontend`);
        sendData({
          type: "success",
          output: outputText,
          model: finalModelUsed,
          timestamp: new Date().toISOString(),
        });
        
        console.timeEnd(`ACT_REQUEST_${requestId}`);
        console.log("========== ACT REQUEST END ==========");

      } catch (error: any) {
        console.error("========== ACT REQUEST ERROR ==========");
        console.error(`[${requestId || "UNKNOWN_ID"}] Request failed:`, error);
        if (error.stack) {
          console.error(`[${requestId || "UNKNOWN_ID"}] Stack trace:`, error.stack);
        }
        sendData({ type: "error", error: error.message || "Transformation failed" });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive"
    }
  });
}
