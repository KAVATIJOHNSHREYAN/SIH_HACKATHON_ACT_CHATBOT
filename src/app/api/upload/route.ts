import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import os from "os";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file was found in the upload payload." },
        { status: 400 }
      );
    }

    // Convert file to buffer and write to temporary storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Using OS tmp directory guarantees we have scratch space on Vercel/serverless environments
    const tempDir = os.tmpdir();
    // Sanitize filename to prevent directory traversal
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filePath = join(tempDir, `act_upload_${Date.now()}_${safeName}`);

    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      fileUrl: filePath, // Returning local absolute path to pass to ModelManager
      fileName: file.name,
      fileType: file.type,
      size: file.size
    });

  } catch (err: any) {
    console.error("Upload Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process multipart upload." },
      { status: 500 }
    );
  }
}
