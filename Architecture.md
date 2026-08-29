# ACT Platform Architecture

## Overview
The ACT (AI Content Transformation) Platform is a powerful Next.js application designed to seamlessly convert, summarize, and transform any form of content (Video, Audio, Images, Documents, Text, and URLs) into standardized outputs (Markdown, PDFs, Docs, Slide decks, CSVs).

## Core Architecture

### Frontend (Client-Side)
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS, Lucide React (Icons)
- **State Management**: React Hooks (`useState`, `useRef`, `useEffect`)
- **Theme**: Context API for Light/Dark mode
- **Modularity**:
  - `src/app/(dashboard)/transform` acts as the hub.
  - Submodules (`video`, `audio`, `ocr`, `documents`, `text`, `images`, `url`) contain specialized UIs.

### Abstractions & Shared Components
- **`OutputPanel`**: A universal export engine supporting 10+ formats (PDF via jsPDF, DOCX via docx.js, PPTX via pptxgenjs, CSV, Markdown, ZIP via JSZip).
- **`presets`**: Centralized deliverables dictionary mapping short keys (e.g., `minutes`, `social_package`) to comprehensive AI extraction prompts.
- **`uploadUtils`**: Handles large files via XMLHttpRequest (XHR) to stream uploads and bypass strict Serverless function payload limits, avoiding HTTP 413 `Request Entity Too Large` errors.

### Backend (API Routes)
- **`/api/upload`**: Writes files efficiently to the operating system's temporary directory (`os.tmpdir()`) returning a secure temporary path to the client. This circumvents Vercel payload limits for file handling.
- **`/api/transform`**: The heavy-lifting engine.
  - Receives `fileUrl` (temp file location) or legacy base64 buffers.
  - Uses Google's `@google/genai` (Gemini 2.0 Flash) through standard configurations or Vertex AI depending on setup.
  - Injects target deliverables (e.g., "Extract action items and assignees").
  - Emits normalized JSON, Markdown, or raw Text to the client.

## Data Flow (Multipart Pipeline)
1. **Selection**: User selects an MP4, PDF, Image, or Audio file.
2. **Upload (Stream)**: The frontend streams the file chunks to `/api/upload` using `multipart/form-data`.
3. **Storage**: Node.js backend intercepts the stream using `fs.createWriteStream` to `os.tmpdir()`.
4. **Transform**: Frontend hits `/api/transform` with the returned `fileUrl` and extraction `preset`.
5. **AI Extraction**: Gemini analyzes the document, image, or video directly via the `fileUrl` context buffer.
6. **Delivery**: The resulting AI generated data is returned to the frontend.
7. **Export**: The `OutputPanel` dynamically converts the result into PPTX, DOCX, CSV, PDF, or Markdown locally.

## Deployment Strategy
- **Platform**: Vercel / AWS Amplify.
- **Storage**: For scalable production, the `os.tmpdir()` should be replaced by a Signed URL direct-to-S3 bucket upload to allow 5GB+ videos.
- **Secrets**: API keys (Gemini, OpenAI, Cohere) are either pulled from `.env` or overridden securely via user `localStorage` settings.
