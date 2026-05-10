import { NextRequest, NextResponse } from "next/server";
import { getVectorStore } from "@/app/lib/vectorStore";
import { RETRIEVAL_K, LLM_MODEL } from "@/app/lib/constants";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentIds, history } = body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: "Missing documentIds array" }, { status: 400 });
    }

    if (!history || !Array.isArray(history) || history.length === 0) {
      return NextResponse.json({ error: "Invalid history array" }, { status: 400 });
    }

    const latestUserMessage = history[history.length - 1];
    const question = latestUserMessage.content;

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Invalid question in history" }, { status: 400 });
    }

    const vectorStore = await getVectorStore();
    
    const retrievedChunks = await vectorStore.similaritySearch(question, RETRIEVAL_K, {
      preFilter: { documentId: { $in: documentIds } },
    });

    if (retrievedChunks.length === 0) {
      return new Response("I couldn't find anything related to that in the document. My analysis is strictly limited to the uploaded file, so I don't have information on that topic.", {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const context = retrievedChunks
      .map(
        (chunk) =>
          `[Page ${chunk.metadata?.loc?.pageNumber || "Unknown"}]\n${chunk.pageContent}`
      )
      .join("\n\n");

    const systemPrompt = `You are Kikandai, an intelligent and highly capable AI assistant analyzing uploaded documents.

Your primary directive is to answer user queries using ONLY the information provided in the context below.

Rules for Interaction:
1. Be conversational, insightful, and helpful. Do not sound like a robotic search engine.
2. If the user asks a question that can be answered by the context, synthesize a clear, well-structured response using bullet points, bold text, and paragraphs.
3. If the user asks for opinions, assumptions, or technical advice that goes beyond the provided text, politely acknowledge their question. Then, inform them that your current analysis is strictly limited to the uploaded document, which does not cover that specific topic.
4. NEVER invent information, and NEVER answer from your general AI memory.

Context:
${context}`;

    const llm = new ChatGoogleGenerativeAI({
      model: LLM_MODEL,
      apiKey: process.env.GOOGLE_API_KEY,
    });

    const messages = [
      new SystemMessage(systemPrompt),
      ...history.map(msg => 
        msg.role === "user" ? new HumanMessage(msg.content) : new AIMessage(msg.content)
      )
    ];

    const stream = await llm.stream(messages);

    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.content) {
            controller.enqueue(new TextEncoder().encode(chunk.content.toString()));
          }
        }
        controller.close();
      }
    });

    return new Response(readableStream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: "Failed to generate answer" }, { status: 500 });
  }
}
