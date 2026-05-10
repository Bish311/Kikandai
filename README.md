<div align="center">
  <div style="background-color: #EF4444; width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
    <h1 style="color: white; margin: 0; font-size: 32px;">K</h1>
  </div>
  <h1>Kikandai (機関台)</h1>
  <p><strong>A Next-Generation RAG-Powered Document Assistant</strong></p>

  <p>
    <a href="https://kikandai.vercel.app/"><b>Live Deployment</b></a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#key-features">Features</a> •
    <a href="#getting-started">Getting Started</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/MongoDB_Atlas-Vector_Search-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB Atlas" />
    <img src="https://img.shields.io/badge/Google_Gemini-3_Flash-4285F4?style=for-the-badge&logo=google" alt="Google Gemini" />
    <img src="https://img.shields.io/badge/LangChain.js-RAG-1C3C3C?style=for-the-badge&logo=langchain" alt="LangChain" />
  </p>
</div>

---

## ⚡ Overview

Kikandai is an intelligent, high-performance **Retrieval-Augmented Generation (RAG)** application. It allows users to upload documents and instantly chat with them. By leveraging the power of MongoDB Atlas Vector Search and Google's latest Gemini 3 Flash model, Kikandai guarantees that every response is strictly grounded in the provided document context, eliminating LLM hallucinations.

## ✨ Key Features

- 📄 **Multi-Format Ingestion**: Drag-and-drop support for **PDF, CSV, and TXT** files.
- 🧠 **Dual-State Memory**: A sophisticated state management system that separates the visual UI chat history from the active LLM context payload, enabling advanced cross-document memory tracking.
- ⚡ **Live Streaming**: Real-time token streaming built on standard Web Streams for instantaneous, typewriter-like response feedback.
- 🔍 **Deep Vector Search**: Semantic retrieval using `gemini-embedding-001` stored in a MongoDB Atlas vector index.
- 🎨 **Premium UI/UX**: A dark-mode first, glassmorphism-inspired aesthetic built with Tailwind CSS and Lucide React icons.

## 🏗️ Architecture

1. **Ingestion (`/api/ingest`)**: Files are parsed via LangChain loaders, split into overlapping chunks (1000 characters), embedded using Gemini, and stored in MongoDB Atlas with a unique `documentId`.
2. **Retrieval (`/api/chat`)**: User queries trigger a vector similarity search across all active `documentIds`.
3. **Generation**: Retrieved chunks are injected into a strict system prompt. The LLM streams the grounded answer back to the UI.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-vector-search) cluster with a configured Vector Search index.
- A [Google Gemini API Key](https://aistudio.google.com/).

### 1. Clone the repository
```bash
git clone https://github.com/Bish311/Kikandai.git
cd kikandai
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=your_mongodb_atlas_uri
GOOGLE_API_KEY=your_google_gemini_api_key
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start chatting with your documents.

## ☁️ Deployment

Kikandai is optimized for Vercel Serverless deployment. Each API route exports `maxDuration = 60` to ensure large PDF documents have ample time to parse and embed during ingestion. The `next.config.ts` marks `pdf-parse` as a server external package for proper bundling.

---

<div align="center">
  <p>Built with ❤️ by <strong>Bishwayan Chatterjee</strong></p>
</div>
