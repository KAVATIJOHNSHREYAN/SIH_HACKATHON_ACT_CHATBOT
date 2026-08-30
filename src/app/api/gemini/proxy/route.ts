import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get("url");
    if (!url) {
      return NextResponse.json({ error: "Missing upload URL" }, { status: 400 });
    }

    // Proxy the request to Google
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-Goog-Upload-Command": "upload, finalize",
        "X-Goog-Upload-Offset": "0",
      },
      // Pipe the incoming request body directly to the outgoing fetch request.
      // This works in the Edge runtime and bypasses the 4.5MB limit.
      body: req.body,
      // @ts-ignore - Required for undici/fetch to allow streaming request bodies
      duplex: "half", 
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: "Upstream upload failed", details: text }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
