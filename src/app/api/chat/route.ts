import { NextRequest, NextResponse } from "next/server";
import { compileGraph } from "@/app/lib/ragGraph";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentIds, history, threadId } = body;

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

    const graph = compileGraph();
    console.log("Graph compiled. Invoking...");

    const initialState = {
      originalQuery: question,
      chatHistory: history,
      documentIds: documentIds,
      threadId: threadId || "default-thread",
    };

    const finalState = await graph.invoke(initialState, { configurable: { thread_id: initialState.threadId } });
    console.log("Graph execution completed.");

    const answer = finalState.generatedAnswer || "I couldn't generate an answer based on the provided documents.";

    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const chunks = answer.split(/(\s+)/);
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
          await new Promise(resolve => setTimeout(resolve, 10)); // fake streaming delay
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
