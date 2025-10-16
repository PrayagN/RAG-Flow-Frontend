"use client";
import React, { useState } from "react";
import {
  Upload,
  Send,
  Loader2,
  FileText,
  CheckCircle,
  XCircle,
  Trash2,
  MessageCircle,
} from "lucide-react";
import ThemeToggle from "./components/Toggle";

// --- Custom Components for Clarity and Reusability ---

// 1. Status Display Component (Simplified for Chat History)
const ChatStatusDisplay: React.FC<{
  uploadStatus: string;
  fileId: string;
  fileName: string | null;
  clearFile: () => void;
}> = ({ uploadStatus, fileId, fileName, clearFile }) => {
  if (!uploadStatus && !fileId) return null;

  const isSuccess = uploadStatus.startsWith("✅");
  const isError = uploadStatus.startsWith("❌");
  const Icon = isSuccess ? CheckCircle : isError ? XCircle : Loader2;
  const textColor = isSuccess
    ? "text-emerald-500"
    : isError
    ? "text-red-500"
    : "text-gray-500";
  const bgColor = isSuccess
    ? "bg-emerald-50"
    : isError
    ? "bg-red-50"
    : "bg-gray-50";

  return (
    <div
      className={`w-full max-w-2xl mx-auto my-4 p-4 rounded-lg flex items-center justify-between text-sm ${bgColor} border border-gray-200 shadow-sm`}
    >
      <div className="flex items-center gap-3">
        <Icon
          size={18}
          className={`${textColor} ${
            uploadStatus.includes("Uploading") ? "animate-spin" : ""
          }`}
        />
        <p className={`font-medium ${textColor}`}>
          {uploadStatus || `Document loaded: ${fileName || "Ready for Q&A"}`}
        </p>
      </div>
      {fileId && (
        <button
          onClick={clearFile}
          title="Clear Document"
          className="p-1 rounded-full text-red-400 hover:text-red-600 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
};

// 2. Chat Message Component
const ChatMessage: React.FC<{ text: string; sender: "user" | "ai" }> = ({
  text,
  sender,
}) => {
  const isUser = sender === "user";
  const bgColor = isUser ? "bg-indigo-50" : "";
  const textColor = "text-gray-800";
  const avatar = isUser ? "👤" : "🧠";

  return (
    <div className={`w-full py-6 ${bgColor} border-b border-gray-100`}>
      <div className="max-w-2xl mx-auto flex gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg">
          {avatar}
        </div>
        <div
          className={`flex-grow ${textColor} whitespace-pre-wrap leading-relaxed`}
        >
          <strong className="font-semibold text-sm mb-1 block">
            {isUser ? "You" : "Assistant"}
          </strong>
          {isUser ? (
            <p>{text}</p>
          ) : (
            <p className="prose text-gray-800">{text}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// 3. Upload/Header Component (Minimal)
const TopBar: React.FC<{
  handleUpload: (e: React.FormEvent) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  file: File | null;
  uploading: boolean;
  fileId: string;
}> = ({ handleUpload, handleFileChange, file, uploading, fileId }) => (
  <div className="w-ful border-b  shadow-sm">
    <div className="max-w-2xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
      <h1 className="text-xl font-bold text-indigo-700 flex items-center gap-2">
        <MessageCircle size={20} /> RAG Chat
      </h1>
      <form onSubmit={handleUpload} className="flex gap-2 items-center">
        <label className="flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full cursor-pointer transition-colors border border-indigo-200 hover:bg-indigo-100 text-indigo-700">
          <Upload size={16} />
          {fileId ? "Change File" : file ? file.name : "Upload Document"}
          <input
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        {!fileId && file && (
          <button
            type="submit"
            disabled={uploading}
            title="Process Document"
            className={`p-2 rounded-full transition-colors shadow-md ${
              uploading
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileText size={16} />
            )}
          </button>
        )}
      </form>
      <ThemeToggle />
    </div>
  </div>
);

// --- Main Component ---

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
}

export default function RAGPage() {
  const [question, setQuestion] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [fileId, setFileId] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadStatus("");
      setFileId(""); // Reset fileId on new file selection
      setMessages([]); // Clear chat history
    }
  };

  const clearFile = () => {
    setFile(null);
    setFileId("");
    setUploadStatus("");
    setMessages([]);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setUploadStatus("⚠️ Please select a file first.");
      return;
    }

    setUploading(true);
    setUploadStatus("Uploading document...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.file_id) {
        setFileId(data.file_id);
        setUploadStatus(
          `✅ Document uploaded! Ready for Q&A (${data.chunks} chunks)`
        );
      } else {
        setUploadStatus(`❌ Upload failed: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus(`❌ Network error during upload.`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userQuestion = question.trim();
    if (!userQuestion || !fileId) return;

    // 1. Add user message to history
    const newMessage: Message = {
      id: Date.now(),
      text: userQuestion,
      sender: "user",
    };
    setMessages((prev) => [...prev, newMessage]);
    setQuestion("");
    setLoading(true);

    // 2. Prepare AI message placeholder
    const aiMessageId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      { id: aiMessageId, text: "", sender: "ai" },
    ]);

    const formData = new FormData();
    formData.append("question", userQuestion);
    formData.append("file_id", fileId);

    try {
      const response = await fetch("http://localhost:8000/ask-stream", {
        method: "POST",
        body: formData,
      });

      if (!response.body) throw new Error("Failed to get response body.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader!.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value);
          console.log("Received chunk:", chunk);

          setMessages((prevMessages) => {
            // Ensure you always base update on prevMessages and do not mutate state
            const newMessages = prevMessages.map((msg) => {
              if (msg.id === aiMessageId) {
                return {
                  ...msg,
                  text: msg.text.endsWith(chunk) ? msg.text : msg.text + chunk, // Avoid duplicate append
                };
              }
              return msg;
            });
            console.log("Updated messages:", newMessages);
            return newMessages;
          });
        }
      }
    } catch (error) {
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        const index = newMessages.findIndex((m) => m.id === aiMessageId);
        if (index !== -1) {
          newMessages[index].text +=
            "\n\nAn error occurred while fetching the answer. Please check the backend service.";
        }
        return newMessages;
      });
      console.error("Streaming error:", error);
    } finally {
      setLoading(false);
    }
  };

  const isInputDisabled = loading || !fileId;

  return (
    <div className="flex flex-col h-screen  bg-background text-foreground dark:bg-background dark:text-foreground">
      {/* Header / Upload Status */}
      <TopBar
        handleUpload={handleUpload}
        handleFileChange={handleFileChange}
        file={file}
        uploading={uploading}
        fileId={fileId}
      />

      {/* Main Chat History Area */}
      <main className="flex-grow overflow-y-auto pt-4 pb-28">
        <ChatStatusDisplay
          uploadStatus={uploadStatus}
          fileId={fileId}
          fileName={file ? file.name : null}
          clearFile={clearFile}
        />

        {messages.length === 0 && (
          <div className="w-full flex flex-col items-center justify-center pt-20 text-gray-400">
            {fileId ? (
              <div className="text-center">
                <MessageCircle size={40} className="mx-auto mb-3" />
                <p className="text-lg font-medium">
                  Ask a question about the document!
                </p>
                <p className="text-sm">Document: **{file?.name}** is ready.</p>
              </div>
            ) : (
              <div className="text-center">
                <Upload size={40} className="mx-auto mb-3" />
                <p className="text-lg font-medium">
                  Start by uploading a document.
                </p>
                <p className="text-sm">PDF or TXT files supported.</p>
              </div>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} text={msg.text} sender={msg.sender} />
        ))}

        {/* Typing Indicator */}
        {loading && (
          <div className="w-full py-6  border-b border-gray-100">
            <div className="max-w-2xl mx-auto flex gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg">
                🧠
              </div>
              <div className="prose text-gray-500">
                <p className="leading-relaxed">
                  <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-75"></span>
                  <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150 ml-1"></span>
                  <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-300 ml-1"></span>
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Input Footer */}
      <div className="fixed bottom-0 w-full  border-t border-gray-200 shadow-xl p-4">
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto flex items-end gap-3"
        >
          <textarea
            rows={1}
            placeholder={
              fileId
                ? "Ask a question about your document..."
                : "Please upload a document first to ask a question."
            }
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
            disabled={isInputDisabled}
            className={`flex-grow border ${
              isInputDisabled
                ? "border-gray-200  cursor-not-allowed"
                : "border-gray-300 focus:ring-indigo-500"
            } rounded-xl p-3 text-gray-800 resize-none focus:outline-none focus:ring-2 transition-colors`}
            style={{ minHeight: "48px", maxHeight: "200px" }} // Allow input to grow up to a point
          />
          <button
            type="submit"
            disabled={isInputDisabled || !question.trim()}
            className={`p-3 rounded-xl font-medium text-white transition-all shadow-md ${
              isInputDisabled || !question.trim()
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg"
            }`}
          >
            <Send size={20} />
          </button>
        </form>
        <div className="max-w-2xl mx-auto mt-2 text-center text-xs text-gray-400">
          RAG Assistant built with Next.js, Tailwind CSS, and FastAPI.
        </div>
      </div>
    </div>
  );
}
