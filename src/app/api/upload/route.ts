import { NextRequest, NextResponse } from "next/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getVectorStore } from "@/app/lib/vectorStore";
import { CHUNK_SIZE, CHUNK_OVERLAP, MAX_FILE_SIZE } from "@/app/lib/constants";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 3MB." },
        { status: 413 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    const blob = new Blob([buffer], { type: "application/pdf" });
    const loader = new PDFLoader(blob);
    const rawDocs = await loader.load();

    if (!rawDocs || rawDocs.length === 0) {
      return NextResponse.json(
        { error: "No extractable text found in PDF" },
        { status: 400 }
      );
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
    });

    const rawChunks = await splitter.splitDocuments(rawDocs);

    const documentId = randomUUID();

    const chunks = rawChunks.map((chunk) => ({
      ...chunk,
      metadata: { ...chunk.metadata, documentId, createdAt: new Date() },
    }));

    const vectorStore = await getVectorStore();
    await vectorStore.addDocuments(chunks);

    return NextResponse.json({
      success: true,
      documentId,
      chunkCount: chunks.length,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { error: "Failed to process PDF" },
      { status: 500 }
    );
  }
}
