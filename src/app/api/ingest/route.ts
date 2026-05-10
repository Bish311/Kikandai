import { NextRequest, NextResponse } from "next/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { randomUUID } from "crypto";
import { getVectorStore } from "@/app/lib/vectorStore";

const MAXIMUM_CHUNK_SIZE = 1000;
const CHUNK_OVERLAP_SIZE = 200;
const DEFAULT_USER_IDENTIFIER = "Bishwayan";

export async function POST(incomingRequest: NextRequest) {
  try {
    const formDataPayload = await incomingRequest.formData();
    const uploadedFile = formDataPayload.get("file") as File | null;

    if (!uploadedFile) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = uploadedFile.name;
    const fileExtension = fileName.split(".").pop()?.toLowerCase();

    if (fileExtension !== "pdf" && fileExtension !== "csv" && fileExtension !== "txt") {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const fileBufferData = await uploadedFile.arrayBuffer();
    const temporaryFileBlob = new Blob([fileBufferData], { type: fileExtension === "pdf" ? "application/pdf" : (fileExtension === "csv" ? "text/csv" : "text/plain") });

    let extractedDocuments;

    if (fileExtension === "pdf") {
      const pdfDocumentLoader = new PDFLoader(temporaryFileBlob);
      extractedDocuments = await pdfDocumentLoader.load();
    } else if (fileExtension === "csv") {
      const csvDocumentLoader = new CSVLoader(temporaryFileBlob);
      extractedDocuments = await csvDocumentLoader.load();
    } else {
      const plainTextContent = await uploadedFile.text();
      extractedDocuments = [{ pageContent: plainTextContent, metadata: { source: fileName } }];
    }

    const textChunkingSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: MAXIMUM_CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP_SIZE,
    });

    const chunkedDocuments = await textChunkingSplitter.splitDocuments(extractedDocuments);

    const generatedDocumentId = randomUUID();

    const preparedChunkedDocuments = chunkedDocuments.map((singleChunk) => ({
      ...singleChunk,
      metadata: {
        ...singleChunk.metadata,
        documentId: generatedDocumentId,
        createdAt: new Date(),
        uploadedBy: DEFAULT_USER_IDENTIFIER,
      },
    }));

    const sharedVectorStore = await getVectorStore();
    await sharedVectorStore.addDocuments(preparedChunkedDocuments);

    return NextResponse.json({ 
      success: true, 
      documentId: generatedDocumentId, 
      chunkCount: chunkedDocuments.length 
    });
  } catch (ingestionError: any) {
    console.error("Ingestion Error:", ingestionError);
    return NextResponse.json({ error: `Ingestion failed: ${ingestionError.message || "Unknown error"}` }, { status: 500 });
  }
}
