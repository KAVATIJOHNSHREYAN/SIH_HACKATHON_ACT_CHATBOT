import React, { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Check, Copy, Download } from "lucide-react";
import jsPDF from "jspdf";
import { Document as DocxDocument, Packer, Paragraph, TextRun } from "docx";
import pptxgen from "pptxgenjs";
import JSZip from "jszip";

interface OutputPanelProps {
  output: string;
  setOutput: (val: string) => void;
  T: any;
  placeholder?: string;
  className?: string;
}

export function OutputPanel({ output, setOutput, T, placeholder = "AI generation output will render here...", className = "h-[580px]" }: OutputPanelProps) {
  const [copied, setCopied] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState("txt");

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!output) return;
    
    try {
      const fileName = `ACT_Export_${Date.now()}`;
      
      if (downloadFormat === "txt" || downloadFormat === "md" || downloadFormat === "json" || downloadFormat === "csv" || downloadFormat === "xml" || downloadFormat === "yaml") {
        let mime = "text/plain";
        if (downloadFormat === "md") mime = "text/markdown";
        if (downloadFormat === "json") mime = "application/json";
        if (downloadFormat === "csv") mime = "text/csv";
        if (downloadFormat === "xml") mime = "application/xml";
        
        const blob = new Blob([output], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.${downloadFormat}`;
        a.click();
      } 
      else if (downloadFormat === "html") {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>ACT Export</title>
              <style>
                body { font-family: system-ui, sans-serif; padding: 40px; color: #111; line-height: 1.6; max-width: 800px; margin: 0 auto; }
                pre { white-space: pre-wrap; font-family: monospace; font-size: 13px; background: #f4f4f5; padding: 20px; border-radius: 8px; border: 1px solid #e4e4e7; }
              </style>
            </head>
            <body>
              <h2>ACT Export</h2>
              <pre>${output}</pre>
            </body>
          </html>
        `;
        const blob = new Blob([htmlContent], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.html`;
        a.click();
      }
      else if (downloadFormat === "pdf") {
        const doc = new jsPDF();
        doc.setFontSize(12);
        const lines = doc.splitTextToSize(output, 180);
        let cursorY = 10;
        lines.forEach((line: string) => {
          if (cursorY > 280) {
            doc.addPage();
            cursorY = 10;
          }
          doc.text(line, 10, cursorY);
          cursorY += 7;
        });
        doc.save(`${fileName}.pdf`);
      }
      else if (downloadFormat === "docx") {
        const paragraphs = output.split("\\n").map(line => new Paragraph({ children: [new TextRun(line)] }));
        const doc = new DocxDocument({ sections: [{ properties: {}, children: paragraphs }] });
        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.docx`;
        a.click();
      }
      else if (downloadFormat === "pptx") {
        const PptxGenJS = typeof pptxgen === 'function' ? pptxgen : (pptxgen as any).default;
        const pres = new PptxGenJS();
        
        const chunks = output.match(/[\s\S]{1,800}(?=\s|$)/g) || [output];
        chunks.forEach(chunk => {
          const slide = pres.addSlide();
          slide.addText(chunk, { x: 0.5, y: 0.5, w: "90%", h: "90%", align: "left", valign: "top", fontSize: 12 });
        });
        
        pres.writeFile({ fileName: `${fileName}.pptx` });
      }
      else if (downloadFormat === "zip") {
        const zip = new JSZip();
        zip.file("act_output.md", output);
        zip.file("act_output.txt", output);
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.zip`;
        a.click();
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export file. Try another format.");
    }
  };

  return (
    <GlassCard className={`${className} flex flex-col justify-between border-slate-200 bg-white shadow-sm`} style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
      <div className="space-y-4 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: T.border }}>
          <span className="text-xs font-bold" style={{ color: T.textPrimary }}>ACT Converted Output</span>
          {output && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[10px] text-purple-500 hover:text-purple-600 font-semibold"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied!" : "Copy Text"}
            </button>
          )}
        </div>

        <textarea
          value={output}
          onChange={(e) => setOutput(e.target.value)}
          placeholder={placeholder}
          className="flex-1 overflow-y-auto p-4 rounded-xl border font-mono text-[11px] leading-relaxed resize-none focus:outline-none focus:border-purple-500"
          style={{ backgroundColor: T.bgInput, borderColor: T.border, color: T.textPrimary }}
        />
      </div>

      {output && (
        <div className="pt-4 border-t flex flex-col sm:flex-row items-center gap-2" style={{ borderColor: T.border }}>
          <select
            value={downloadFormat}
            onChange={(e) => setDownloadFormat(e.target.value)}
            className="p-2 border rounded-lg text-xs flex-1 focus:outline-none focus:border-purple-500"
            style={{ backgroundColor: T.bgInput, borderColor: T.border, color: T.textPrimary }}
          >
            <option value="txt">TXT Document</option>
            <option value="md">Markdown (.md)</option>
            <option value="pdf">PDF Document</option>
            <option value="docx">Word (.docx)</option>
            <option value="csv">CSV Spreadsheet</option>
            <option value="json">JSON Data</option>
            <option value="html">HTML Page</option>
            <option value="pptx">PowerPoint (.pptx)</option>
            <option value="xml">XML Data</option>
            <option value="yaml">YAML File</option>
            <option value="zip">ZIP Package</option>
          </select>
          <Button onClick={handleDownload} className="text-xs py-2 px-6 rounded-lg bg-purple-650 hover:bg-purple-750 flex-1 sm:flex-none whitespace-nowrap">
            <Download className="h-3.5 w-3.5 mr-2" />
            Export Output
          </Button>
        </div>
      )}
    </GlassCard>
  );
}
