# Kikandai

Kikandai is a high-performance RAG (Retrieval-Augmented Generation) document assistant built to provide precise, context-aware answers from uploaded documents.

## Tech Stack
- **Framework**: Next.js 15+ (App Router)
- **Database**: MongoDB Atlas with Vector Search
- **Orchestration**: LangChain.js
- **Embeddings**: Google Gemini (`gemini-embedding-001`)
- **LLM**: Google Gemini 3 Flash (`gemini-3-flash-preview`)
- **Styling**: Vanilla CSS + Tailwind

## Key Features
- **Multi-Format Ingestion**: Full support for PDF, CSV, and TXT files.
- **Dual-State Memory**: Independent visual chat history and active LLM context for smarter conversations.
- **Live Streaming**: Real-time token streaming for instantaneous response feedback.
- **Vector Search**: Deep semantic retrieval using MongoDB Atlas Vector Index.

## Getting Started

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

## Author
**Bishwayan Chatterjee**
