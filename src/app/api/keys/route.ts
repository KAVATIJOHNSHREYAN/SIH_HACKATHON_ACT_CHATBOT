import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    geminiKey: process.env.GEMINI_API_KEY || "",
    openaiKey: process.env.OPENAI_API_KEY || "",
    pineconeKey: process.env.PINECONE_API_KEY || "",
    cohereKey: process.env.COHERE_API_KEY || ""
  });
}
