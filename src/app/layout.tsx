import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/contexts/UserContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ACT | AI Content Transformation Platform",
  description: "Transform your documents, files, audios, and text seamlessly using ACT, the next-generation enterprise content AI transformation engine.",
  keywords: ["AI transformation", "PDF summary", "OCR text extraction", "content generation", "RAG chat"],
  authors: [{ name: "ACT Platform Team" }],
  metadataBase: new URL("https://sih-hackathon-act-chatbot.vercel.app"),
  openGraph: {
    type: "website",
    url: "https://sih-hackathon-act-chatbot.vercel.app",
    title: "ACT | AI Content Transformation Platform",
    description: "Transform your documents, files, audios, and text seamlessly using ACT, the next-generation enterprise content AI transformation engine.",
    siteName: "ACT Platform",
    images: [
      {
        url: "/logo-1024.png",
        width: 1024,
        height: 1024,
        alt: "ACT — AI Content Transformation Assistant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ACT | AI Content Transformation Platform",
    description: "Transform your documents, files, audios, and text seamlessly using ACT, the next-generation enterprise content AI transformation engine.",
    images: ["/logo-1024.png"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo-1024.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground bg-gradient-mesh relative">
        {/* Subtle Watermark Logo in background */}
        <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.025]">
          <img src="/logo.png" alt="ACT Watermark" className="w-[600px] h-[600px] object-contain max-w-[90vw]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col">
          <UserProvider>
            {children}
          </UserProvider>
        </div>
      </body>
    </html>
  );
}
