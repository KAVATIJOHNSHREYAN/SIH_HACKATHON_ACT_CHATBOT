import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { fileName, mimeType, byteSize, apiKey: clientApiKey } = await req.json();
    
    const activeKey = clientApiKey || process.env.GEMINI_API_KEY;

    if (!activeKey) {
      return NextResponse.json({ error: "No Gemini API Key configured on server." }, { status: 400 });
    }

    const url = `https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=resumable&key=${activeKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": byteSize.toString(),
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ file: { displayName: fileName } })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[GEMINI_UPLOAD_ERROR]", errorText);
      return NextResponse.json({ error: "Failed to initialize Gemini upload session." }, { status: res.status });
    }

    const uploadUrl = res.headers.get("x-goog-upload-url");
    
    if (!uploadUrl) {
      return NextResponse.json({ error: "Did not receive upload URL from Gemini." }, { status: 500 });
    }

    return NextResponse.json({ uploadUrl });
  } catch (error: any) {
    console.error("[GEMINI_UPLOAD_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
