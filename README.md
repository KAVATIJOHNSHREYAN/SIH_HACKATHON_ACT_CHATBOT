# ACT (AI Content Transformation) Platform

## Overview
ACT is a centralized hub for AI Content Transformation. It supports parsing Videos, Audio, OCR, Images, PDF Documents, Raw Text, and Web URLs, routing them through advanced Gemini 2.0 AI models, and generating 40+ standardized deliverables ranging from Markdown summaries and Social Media packs to fully-formatted Word Documents (DOCX) and Slide Presentations (PPTX).

## Features
- **Universal Export Engine**: Download outputs in TXT, MD, CSV, JSON, XML, PDF, DOCX, and PPTX formats.
- **Multipart Chunked Uploads**: Automatically handles files up to 150MB by utilizing temp stream bypass for Next.js APIs.
- **Dynamic AI Presets**: Support for `Executive Summary`, `Video Script`, `Action Items`, `MCQs`, `Code Explanation` and more.
- **UI Architecture**: Glassmorphism design system supporting standard Light and Dark modes securely.
- **Modules**:
  1. Video & Audio Engine
  2. OCR & Image Vision Engine
  3. Text & Document Semantic Engine
  4. Web URL Crawl Engine

## Getting Started

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Duplicate the `.env.example` file and rename it to `.env.local`. Fill in the required API Keys:
   ```bash
   cp .env.example .env.local
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Navigate to `http://localhost:3000` to start exploring the workspace.

## System Requirements
- Node.js 18.x or above
- API Key from Google Gemini API (or alternatives like OpenAI/Cohere supported in the UI Settings)

## Core Libraries Used
- **Next.js** (App Router & Serverless functions)
- **Tailwind CSS** (Styling)
- **jsPDF**, **docx**, **pptxgenjs** (Client-side native format generation)
- **Lucide React** (Consistent iconography)
