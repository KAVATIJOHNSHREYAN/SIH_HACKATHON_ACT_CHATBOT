"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Folder, 
  FileText, 
  Search, 
  Star, 
  Plus, 
  Trash2, 
  Copy, 
  Download, 
  MoreVertical, 
  FolderPlus,
  Upload,
  ArrowLeft
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: string;
  project: string;
  starred: boolean;
  tag: string;
  date: string;
}

export default function FilesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStarred, setFilterStarred] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [folders, setFolders] = useState<string[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Initialize and read from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedFiles = localStorage.getItem("act_user_files");
      if (storedFiles) {
        setFiles(JSON.parse(storedFiles));
      } else {
        // Start completely empty on first launch
        setFiles([]);
      }

      const storedFolders = localStorage.getItem("act_user_folders");
      if (storedFolders) {
        setFolders(JSON.parse(storedFolders));
      } else {
        // Start with default empty folders or let user create them
        setFolders(["Legal Contracts", "Financial Briefings", "Marketing Transcripts", "Research Notes"]);
      }
    }
  }, []);

  const saveFiles = (newFiles: FileItem[]) => {
    setFiles(newFiles);
    if (typeof window !== "undefined") {
      localStorage.setItem("act_user_files", JSON.stringify(newFiles));
    }
  };

  const toggleStar = (id: string) => {
    const updated = files.map(f => f.id === id ? { ...f, starred: !f.starred } : f);
    saveFiles(updated);
  };

  const deleteFile = (id: string) => {
    const updated = files.filter(f => f.id !== id);
    saveFiles(updated);
    setActiveMenuId(null);
  };

  const duplicateFile = (file: FileItem) => {
    const newFile: FileItem = {
      ...file,
      id: Math.random().toString(),
      name: file.name.replace(".", "_copy.")
    };
    const updated = [...files, newFile];
    saveFiles(updated);
    setActiveMenuId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    Array.from(uploadedFiles).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const mockUpload: FileItem = {
          id: Math.random().toString(),
          name: file.name,
          type: file.name.split('.').pop()?.toUpperCase() || "File",
          size: (file.size / 1024 / 1024).toFixed(2) + " MB",
          project: currentFolder || "General",
          starred: false,
          tag: selectedTag || "General",
          date: new Date().toISOString().split('T')[0]
        };
        const updated = [mockUpload, ...files];
        saveFiles(updated);
      };
      reader.readAsDataURL(file);
    });
  };

  const createFolder = () => {
    const folderName = prompt("Enter new folder name:");
    if (folderName && !folders.includes(folderName)) {
      const updated = [...folders, folderName];
      setFolders(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem("act_user_folders", JSON.stringify(updated));
      }
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStar = filterStarred ? file.starred : true;
    const matchesFolder = currentFolder ? file.project === currentFolder : true;
    const matchesTag = selectedTag ? file.tag === selectedTag : true;
    return matchesSearch && matchesStar && matchesFolder && matchesTag;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <input 
        type="file" 
        multiple 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            {currentFolder && (
              <button 
                onClick={() => setCurrentFolder(null)}
                className="p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            {currentFolder ? currentFolder : "My Files"}
          </h1>
          <p className="text-slate-400 text-xs mt-1">Manage documents, audios, folders, and tags for RAG query referencing.</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="flex items-center gap-1.5" onClick={createFolder}>
            <FolderPlus className="h-4 w-4" />
            New Folder
          </Button>
          <Button size="sm" className="flex items-center gap-1.5" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" />
            Upload File
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-6">
          <GlassCard className="p-4 space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">File Filters</h2>
            <div className="space-y-1">
              <button
                onClick={() => { setFilterStarred(false); setCurrentFolder(null); setSelectedTag(null); }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold hover:bg-white/5 text-slate-300 hover:text-white transition-colors"
              >
                All Files
              </button>
              <button
                onClick={() => setFilterStarred(!filterStarred)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                  filterStarred ? "bg-purple-600/10 border border-purple-500/20 text-white" : "hover:bg-white/5 text-slate-300 hover:text-white"
                }`}
              >
                <span>Starred</span>
                <Star className="h-3.5 w-3.5 text-purple-400 fill-current" />
              </button>
            </div>

            <div className="border-t border-white/10 pt-4 space-y-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tags</h2>
              <div className="flex flex-wrap gap-1.5">
                {["Finance", "Marketing", "Legal", "Research", "Healthcare"].map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-colors ${
                      selectedTag === t 
                        ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
                        : "bg-slate-900 border-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="md:col-span-3 space-y-6">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
              <Search className="h-4.5 w-4.5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by file name..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {!currentFolder && (
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {folders.map(folder => (
                <button
                  key={folder}
                  onClick={() => setCurrentFolder(folder)}
                  className="flex items-center gap-3 p-4 rounded-xl bg-slate-950/40 hover:bg-slate-950 border border-white/5 hover:border-purple-500/20 text-left transition-all group"
                >
                  <Folder className="h-7 w-7 text-purple-400 shrink-0 group-hover:scale-105 transition-transform" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{folder}</p>
                    <span className="text-[9px] text-slate-500">
                      {files.filter(f => f.project === folder).length} items
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <GlassCard className="border-white/5 p-0 overflow-hidden">
            {filteredFiles.length === 0 ? (
              <div className="py-20 text-center text-slate-500">
                <FileText className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                <p className="text-xs font-semibold">No files found</p>
                <p className="text-[10px] text-slate-600">Try matching different query bounds or filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-500 font-medium bg-slate-950/40">
                      <th className="py-3 px-4 w-8"></th>
                      <th className="py-3 px-2">File Name</th>
                      <th className="py-3 px-2">Size</th>
                      <th className="py-3 px-2">Tag</th>
                      <th className="py-3 px-2">Created</th>
                      <th className="py-3 px-4 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {filteredFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-white/5 transition-colors relative">
                        <td className="py-3 px-4">
                          <button onClick={() => toggleStar(file.id)} className="text-slate-500 hover:text-yellow-400">
                            <Star className={`h-4.5 w-4.5 ${file.starred ? "text-yellow-400 fill-current" : ""}`} />
                          </button>
                        </td>
                        <td className="py-3 px-2 font-semibold text-slate-200">
                          <span className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-purple-400 shrink-0" />
                            {file.name}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-slate-400">{file.size}</td>
                        <td className="py-3 px-2">
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-white/10 text-slate-400 text-[10px]">
                            {file.tag}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-slate-400">{file.date}</td>
                        <td className="py-3 px-4 relative">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === file.id ? null : file.id)}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <MoreVertical className="h-4.5 w-4.5" />
                          </button>

                          {activeMenuId === file.id && (
                            <div className="absolute right-8 top-2 w-36 rounded-xl bg-slate-950 border border-white/10 shadow-2xl p-1.5 z-40">
                              <button
                                onClick={() => duplicateFile(file)}
                                className="w-full text-left px-2 py-1.5 rounded-lg text-[10px] text-slate-300 hover:bg-white/5 flex items-center gap-2"
                              >
                                Copy File
                              </button>
                              <button
                                onClick={() => deleteFile(file.id)}
                                className="w-full text-left px-2 py-1.5 rounded-lg text-[10px] text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                              >
                                Delete File
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
