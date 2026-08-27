# ACT (AI Content Transformation Platform) — Project Notes Summary

This is a comprehensive, structured reference sheet detailing every module, technical stack component, and feature of the ACT Platform. It is designed to be easily read or presented to explain the architecture and capabilities of the platform.

---

## 🎯 Problem Statement

Modern individuals, content creators, and enterprise teams face significant friction when managing, transforming, and extracting value from diverse file formats (Dense PDFs, audio recordings, images/scans, and code snippets). The core challenges they face include:

1. **Fragmentation of Tools:** Users must switch between separate, single-purpose tools for Optical Character Recognition (OCR), speech-to-text audio transcription, document summarization, and file storage, resulting in a broken and inefficient workflow.
2. **Manual Overhead & Bottlenecks:** Manually reading dense multi-page PDFs, transcribing hours of audio files, and copying text from images/scans creates enormous operational bottlenecks and wastes human capital.
3. **Clunky Authentication & Setup:** Most utility dashboards lack modern, high-speed authentication features—such as biometric login (Windows Hello, Fingerprint, Face ID) and multi-account Google selection—making accessibility a hassle.
4. **Poor UI/UX Contrast:** Existing productivity platforms often fail to support cohesive, high-contrast design themes (like Dark Blue vs Light Green modes), causing visual strain and poor readability in different environments.

**The Solution:** **ACT (AI Content Transformation Platform)** bridges these gaps by offering a single, unified, premium workspace powered by Google Gemini and Cohere. It automates OCR scanning, live audio transcription, document chat, and metadata extraction, backed by passwordless biometrics and responsive design systems.

---

## 🔗 Project Links

*   **GitHub Repository:** [KAVATIJOHNSHREYAN/SIH_HACKATHON_ACT_CHATBOT](https://github.com/KAVATIJOHNSHREYAN/SIH_HACKATHON_ACT_CHATBOT)
*   **Live Vercel Application:** [sih-hackathon-act-chatbot.vercel.app](https://sih-hackathon-act-chatbot.vercel.app/)

---

## 🛠 Core Tech Stack

*   **Framework:** Next.js 16.3 (React 19) utilising standard App Router conventions.
*   **Styling & Design System:**
    *   **Tailwind CSS:** Utilised for layouts and modern component styling.
    *   **Vanilla CSS Themes:** Dynamic token-based theme maps in `@/contexts/ThemeContext` defining HSL styling variables. Supports **Light Green Theme** (soft light green `#f0fdf4` backdrop with dark green `#0d2d0d` texts) and **Dark Blue Theme** (sleek `#060d1a` background with blue highlight accents).
*   **Micro-Animations:** Framer Motion for premium hover states and smooth viewport transitions.
*   **Icons:** Lucide React.
*   **Libraries & APIs:**
    *   **AI Integration:** `@google/generative-ai` SDK and Cohere Command R+ client APIs.
    *   **Docx Parsing:** `Mammoth` client-side parser.
    *   **Biometrics:** Browser-native WebAuthn API (`navigator.credentials`).
    *   **Speech Recognition:** Browser-native Web Speech API (`webkitSpeechRecognition`).
    *   **Media Access:** HTML5 Canvas & `navigator.mediaDevices.getUserMedia` for webcams.

---

## 📂 Core Modules & Features (Point-Wise)

### 1. Unified Authentication Suite (`/auth/login` & `/auth/register`)
*   **Google OAuth Implicit Login:**
    *   Redirects to Google Identity using implicit client flow.
    *   Forces account select screen (`&prompt=select_account`) so users can choose between multiple Google accounts on mobile or laptop.
    *   Parses incoming access tokens from the URL hash, pulls verified userinfo (name, email, profile photo), and signs them in.
*   **WebAuthn Biometrics:**
    *   Prominent secure sign-in controls: **Fingerprint**, **Face ID**, and **Windows Hello** (laptop credentials).
    *   Utilises native browser cryptographic keys for authentication with an intelligent simulated sandbox fallback.
*   **Dynamic Theme Matching:**
    *   Adapts instantly to the active mode (Soft white/green card for light theme, dark transparent card for dark theme).

### 2. Main Dashboard & Analytics Portal (`/dashboard` & `/analytics`)
*   **Resource Metrics:** Displays storage limits, active credits, and transformation throughput.
*   **Quick Action Cards:** Integrated redirects to specialized pipelines (Audio, OCR, JSON, Batch).
*   **Activity Logs:** Keeps track of previous document and audio conversions.

### 3. Audio Transform & Transcription (`/transform/audio`)
*   **Live Microphone Capture:**
    *   Standard SpeechRecognition engine transcribing voice inputs in real-time.
    *   Deduplication algorithm that refreshes the text stream cleanly on new results.
    *   Background listener termination (`.abort()`) to prevent ghost speech detection when recording is turned off.
*   **Local Media Support:** Upload hooks supporting `.wav`, `.mp3`, and `.m4a` playbacks and transcription.
*   **Download Options:** Direct buttons to copy transcripts or download text output files.

### 4. OCR Scanner & Camera Capture (`/transform/ocr`)
*   **Webcam Viewfinder:** Native camera viewport rendering. Requests mic/camera permissions and captures high-resolution canvas snapshots.
*   **Document Dropzone:** Allows dropping images (PNG, JPG) and PDF files.
*   **Text Recognition:** Converts visual text layouts into downloadable and copyable formats using AI transform pipelines.

### 5. Chat & Context Hub (`/chat`)
*   **Chat with Documents:** Upload raw text/markdown context and ask questions to the model.
*   **History & Pins:** Sidebar utilities to favorite, pin, share, and review conversation transcripts.
