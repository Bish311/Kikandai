<div align="center">

  <h1>Kikandai (機関台)</h1>
  <p><strong>A Next-Generation RAG-Powered Document Assistant</strong></p>

  <p>
    <a href="https://kikandai.vercel.app/"><b>Live Deployment</b></a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-key-features">Features</a> •
    <a href="#-getting-started">Getting Started</a>
  </p>

  <img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/MongoDB_Atlas-Vector_Search-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB Atlas" />
  <img src="https://img.shields.io/badge/Gemini_3_Flash-LLM-4285F4?style=for-the-badge&logo=google" alt="Google Gemini" />
  <img src="https://img.shields.io/badge/LangChain.js-RAG-1C3C3C?style=for-the-badge&logo=langchain" alt="LangChain" />

</div>

<br/>

## ⚡ Overview

Kikandai is an intelligent **Retrieval-Augmented Generation (RAG)** application that lets users upload documents and instantly chat with them. Powered by MongoDB Atlas Vector Search and Google Gemini 3 Flash, every response is strictly grounded in the uploaded document context — zero hallucinations.

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **LLM** | Google Gemini 3 Flash (`gemini-3-flash-preview`) |
| **Embeddings** | Google Gemini (`gemini-embedding-001`) |
| **Vector DB** | MongoDB Atlas Vector Search |
| **Orchestration** | LangChain.js |
| **Styling** | Tailwind CSS v4 + Lucide Icons |
| **Deployment** | Vercel Serverless |

## ✨ Key Features

- 📄 **Multi-Format Ingestion** — Drag-and-drop support for PDF, CSV, and TXT files
- 🧠 **Dual-State Memory** — Separates visual UI history from active LLM context for smarter conversations
- ⚡ **Live Streaming** — Real-time token streaming via Web Streams API
- 🔍 **Cross-Document Search** — Semantic retrieval across all uploaded documents simultaneously
- 🎨 **Premium UI** — Dark-mode first, glassmorphism-inspired design

## 🏗️ Architecture

```
User Upload → /api/ingest → Parse (PDF/CSV/TXT) → Chunk (1000 chars) → Embed (Gemini) → Store (MongoDB Atlas)
                                                                                              ↓
User Query  → /api/chat   → Vector Search ($in filter) → Context Injection → Gemini 3 Flash → Stream Response
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-vector-search) cluster with Vector Search index
- [Google Gemini API Key](https://aistudio.google.com/)

### Setup

```bash
git clone https://github.com/Bish311/Kikandai.git
cd kikandai
npm install
```

Create `.env.local`:
```env
MONGODB_URI=your_mongodb_atlas_uri
GOOGLE_API_KEY=your_google_gemini_api_key
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start chatting with your documents.

## ☁️ Deployment

Optimized for Vercel. Each API route exports `maxDuration = 60` for large document processing. The `next.config.ts` marks `pdf-parse` as a server external package for proper serverless bundling.

---

<div align="center">
  <sub>Built by <strong>Bishwayan Chatterjee</strong></sub>
</div>
