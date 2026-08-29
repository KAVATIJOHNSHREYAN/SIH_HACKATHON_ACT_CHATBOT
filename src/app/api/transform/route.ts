import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { ModelManager } from "@/ai/ModelManager";

export async function POST(req: NextRequest) {
  try {
    const { 
      text, fileData, fileUrl, fileName, fileType, format, model, apiKey, openaiKey, cohereKey,
      targetFormats, audience, tone, language, detailLevel, communicationObjective, contentStyle 
    } = await req.json();

    let extractedText = "";

    // 1. CONTENT EXTRACTION PORTAL
    if (fileData || fileUrl) {
      let fileBuffer: Buffer | null = null;
      let base64Content = "";

      if (fileData) {
        // Decode base64 data
        const commaIndex = fileData.indexOf(",");
        base64Content = commaIndex !== -1 ? fileData.slice(commaIndex + 1) : fileData;
        fileBuffer = Buffer.from(base64Content, "base64");
      }

      if (fileBuffer && (fileType?.includes("officedocument.wordprocessingml") || fileName?.endsWith(".docx"))) {
        // Parse DOCX paragraphs, tables, headings using mammoth
        const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
        extractedText = docxResult.value;
      } else {
        const activeKey = apiKey || process.env.GEMINI_API_KEY;
        const openAIKey = openaiKey || process.env.OPENAI_API_KEY;
        const resolvedCohereKey = cohereKey || process.env.COHERE_API_KEY;
        if (!activeKey && !openAIKey && !resolvedCohereKey) {
          extractedText = `[Sandbox Mock Document Content Extracted from ${fileName}]\n\n- File Type: ${fileType}\n- Mock content: Standard enterprise contract clauses, SLA timelines (Phase 1 rollout set for October 15, APIs finalized by December 1), and section 12.4 governing liabilities.\n- OCR/Audio Transcription: Completed successfully.`;
        } else {
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
      return NextResponse.json(
        { success: false, error: "Extraction pipeline yielded empty content." },
        { status: 400 }
      );
    }

    // 2. AI MODEL PROCESSING PORTAL
    const activeKey = apiKey || process.env.GEMINI_API_KEY;
    const openAIKey = openaiKey || process.env.OPENAI_API_KEY;
    const resolvedCohereKey = cohereKey || process.env.COHERE_API_KEY;

    if (!activeKey && !openAIKey && !resolvedCohereKey) {
      const sandboxTransformation = `### [Sandbox Mode Activated]\n\nNo active API Key was detected in your Settings panel or environment.\n\nACT completed transformation using the extracted document text:\n\n**Source Title:** ${fileName || "Text Paste"}\n**Target Format:** ${format}\n\n**Extracted Document Content Context:**\n"""\n${extractedText.slice(0, 300)}...\n"""\n\n*Configure your API key in Settings to activate live generations.*`;
      return NextResponse.json({ success: true, output: sandboxTransformation });
    }

    // Build the instruction
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

    const prompt = `You are ACT (AI Content Transformation Assistant), an enterprise-grade content transformation engine.
${formatInstruction}
${audienceInstruction}${toneInstruction}${languageInstruction}${detailInstruction}${objectiveInstruction}${styleInstruction}

Ensure the output is high-quality and styled in clean Markdown. For specific formats like Video Package, Infographic, Presentation, Advisory, or Executive Summary, use structured sections (Title, Script, Slides, Recommendations, etc.) as appropriate.

Extracted Document Content:
"""
${extractedText}
"""
`;

    const { text: outputText, modelUsed } = await ModelManager.generateContent(
      prompt,
      "You are ACT (AI Content Transformation Assistant), an enterprise-grade content transformation engine.",
      activeKey || undefined,
      model,
      undefined,
      openAIKey || undefined,
      resolvedCohereKey || undefined
    );

    return NextResponse.json({
      success: true,
      output: outputText,
      model: modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("ACT transformation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to transform content." },
      { status: 500 }
    );
  }
}
