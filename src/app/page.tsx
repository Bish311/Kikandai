"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Sun, Moon, Send, UploadCloud, FileText, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import { MAX_FILE_SIZE } from "./lib/constants";

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [documents, setDocuments] = useState<{name: string, status: string, id: string | null}[]>([]);
  
  const [visualChatHistory, setVisualChatHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "Welcome to Kikandai, Upload a document to begin." }
  ]);
  const [activeContextHistory, setActiveContextHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);

  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [threadId, setThreadId] = useState("");

  useEffect(() => {
    setThreadId(crypto.randomUUID());
    const savedTheme = localStorage.getItem('kikandai-theme');
    const shouldBeDark = savedTheme ? savedTheme === 'dark' : true;
    setIsDarkMode(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('kikandai-theme', newMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newMode);
  };

  const processFile = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      alert("File too large. Maximum size is 3MB.");
      return;
    }
    const allowedTypes = ["application/pdf", "text/csv", "text/plain"];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
      alert("Only PDF, CSV, and TXT files are supported.");
      return;
    }

    const docIndex = documents.length;
    setDocuments(prev => [...prev, { name: file.name, status: "Uploading...", id: null }]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setDocuments(prev => prev.map((d, i) => i === docIndex ? { ...d, status: "Indexing..." } : d));
      const response = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to upload file");
      
      setDocuments(prev => prev.map((d, i) => i === docIndex ? { ...d, status: "Ready", id: data.documentId } : d));
      
      setActiveContextHistory(previousState => previousState.slice(-2));
    } catch (error: any) {
      setDocuments(prev => prev.map((d, i) => i === docIndex ? { ...d, status: "Error" } : d));
      alert(error.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files?.[0]; if (file) processFile(file); };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const readyDocs = documents.filter(d => d.status === "Ready");
    const activeDocIds = readyDocs.map(d => d.id).filter(Boolean) as string[];
    
    if (!currentQuestion.trim() || activeDocIds.length === 0 || isThinking) return;

    const question = currentQuestion;
    setCurrentQuestion("");
    setIsThinking(true);

    const userMessage = { role: "user" as const, content: question };

    const newVisualHistory = [...visualChatHistory, userMessage];
    setVisualChatHistory(newVisualHistory);

    const newActiveContext = [...activeContextHistory, userMessage];
    setActiveContextHistory(newActiveContext);

    const visualAssistantIndex = newVisualHistory.length;
    setVisualChatHistory([...newVisualHistory, { role: "assistant" as const, content: "" }]);

    const contextAssistantIndex = newActiveContext.length;
    setActiveContextHistory([...newActiveContext, { role: "assistant" as const, content: "" }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIds: activeDocIds, history: newActiveContext, threadId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      if (!response.body) throw new Error("Empty response body");

      const streamReader = response.body.getReader();
      const textDecoder = new TextDecoder("utf-8");
      let isStreamComplete = false;
      let accumulatedResponseText = "";

      while (!isStreamComplete) {
        const { value, done } = await streamReader.read();
        isStreamComplete = done;

        if (value) {
          const decodedChunk = textDecoder.decode(value, { stream: true });
          accumulatedResponseText += decodedChunk;

          setVisualChatHistory((prev) => {
            const updatedHistory = [...prev];
            updatedHistory[visualAssistantIndex] = {
              role: "assistant",
              content: accumulatedResponseText,
            };
            return updatedHistory;
          });

          setActiveContextHistory((prev) => {
            const updatedHistory = [...prev];
            updatedHistory[contextAssistantIndex] = {
              role: "assistant",
              content: accumulatedResponseText,
            };
            return updatedHistory;
          });
        }
      }
    } catch (error: any) {
      setVisualChatHistory((prev) => {
        const updatedHistory = [...prev];
        updatedHistory[visualAssistantIndex] = {
          role: "assistant",
          content: `I encountered an error: ${error.message || "Unknown error"}`,
        };
        return updatedHistory;
      });
      setActiveContextHistory((prev) => {
        const updatedHistory = [...prev];
        updatedHistory[contextAssistantIndex] = {
          role: "assistant",
          content: `I encountered an error: ${error.message || "Unknown error"}`,
        };
        return updatedHistory;
      });
    } finally {
      setIsThinking(false);
    }
  };

  const activeDocIds = documents.filter(d => d.status === "Ready").map(d => d.id).filter(Boolean);
  const isChatReady = activeDocIds.length > 0;

  return (
    <div className="h-screen w-full flex flex-col relative font-sans overflow-hidden bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      <div className="absolute inset-0 pointer-events-none opacity-5 dark:opacity-10 bg-[radial-gradient(#EF4444_1px,transparent_1px)] [background-size:32px_32px] animate-[drift_20s_linear_infinite]" />
      
      <header className="flex-none h-16 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/20">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <h1 className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-100">
            Kikandai <span className="text-zinc-400 dark:text-zinc-500 font-normal">Assistant</span>
          </h1>
        </div>
        
        <button 
          onClick={toggleTheme}
          className="p-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      <main className="flex-1 flex overflow-hidden z-10 p-6 gap-6">
        <section className="w-[60%] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative">
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {visualChatHistory.map((msg, idx) => (
              <div key={idx} className={`flex flex-col max-w-[80%] ${msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}>
                <span className="text-xs text-zinc-400 dark:text-zinc-500 mb-1.5 px-1 font-medium">{msg.role === "user" ? "You" : "Kikandai"}</span>
                <div className={`px-5 py-3.5 text-[15px] leading-relaxed shadow-sm ${
                  msg.role === "user" 
                    ? "bg-red-500 text-white rounded-2xl rounded-br-sm" 
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-2xl rounded-bl-sm"
                }`}>
                  {msg.role === "user" ? msg.content : msg.content === "" && isThinking && idx === visualChatHistory.length - 1 ? (
                    <div className="flex items-center gap-1.5 h-6">
                      <div className="w-2 h-2 rounded-full bg-red-400 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-red-400 animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 rounded-full bg-red-400 animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  ) : (
                    <ReactMarkdown components={{
                      p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-semibold text-zinc-900 dark:text-white" {...props} />,
                      li: ({ node, ...props }) => <li {...props} />
                    }}>{msg.content}</ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-5 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800/80">
            <form onSubmit={handleAskQuestion} className="flex gap-3 relative">
              <input
                type="text"
                value={currentQuestion}
                onChange={(e) => setCurrentQuestion(e.target.value)}
                disabled={!isChatReady || isThinking}
                placeholder={isChatReady ? "Ask a question..." : "Upload a document first..."}
                className="flex-1 px-6 py-4 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all disabled:opacity-50 shadow-inner"
              />
              <button
                type="submit"
                disabled={!currentQuestion.trim() || !isChatReady || isThinking}
                className="absolute right-2 top-2 bottom-2 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:hover:bg-red-500 cursor-pointer shadow-md"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </div>
        </section>

        <section className="w-[40%] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/80">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-5 flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-500" />
              Knowledge Base
            </h2>
            
            <div 
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer group ${
                isDragging 
                  ? "border-red-500 bg-red-50 dark:bg-red-500/10 scale-[1.02]" 
                  : "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:border-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/30"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-zinc-700 dark:text-zinc-200 font-medium mb-1">Click or drag document</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">PDF/CSV/TXT up to 3MB</p>
              <input type="file" accept="application/pdf,text/csv,text/plain" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {documents.map((doc, idx) => (
              <div key={idx} className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex items-center gap-3 group hover:border-red-200 dark:hover:border-red-900/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 text-red-500">
                  {doc.status === "Ready" ? <FileText className="w-5 h-5" /> : <Loader2 className="w-5 h-5 animate-spin" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{doc.name}</p>
                  
                  {doc.status === "Ready" ? (
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 uppercase tracking-wide">
                      <CheckCircle2 className="w-3 h-3" /> Ready
                    </span>
                  ) : (
                    <p className={`text-xs mt-0.5 ${doc.status === "Error" ? "text-red-500" : "text-zinc-500 dark:text-zinc-400 animate-pulse"}`}>
                      {doc.status}
                    </p>
                  )}
                </div>
                {doc.status === "Ready" && (
                  <button onClick={() => setDocuments(docs => docs.filter((_, i) => i !== idx))} className="w-8 h-8 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {documents.length === 0 && (
              <div className="h-full flex items-center justify-center text-center p-6 text-sm text-zinc-400 dark:text-zinc-500">
                No documents uploaded yet.
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="flex-none h-10 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">System Online</p>
        </div>
      </footer>
    </div>
  );
}
