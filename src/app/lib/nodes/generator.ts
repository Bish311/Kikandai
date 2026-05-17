import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RagGraphState } from "../ragGraphState";
import { LLM_MODEL } from "../constants";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

export async function generator(state: typeof RagGraphState.State): Promise<Partial<typeof RagGraphState.State>> {
  const llm = new ChatGoogleGenerativeAI({
    model: LLM_MODEL,
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 1.0,
  });

  const isWebSearch = state.evaluationScore === "INCORRECT" && state.webSearchResults && state.webSearchResults.length > 0;
  const docsToUse = isWebSearch ? state.webSearchResults : state.rerankedDocuments;

  let context = "";
  if (docsToUse && docsToUse.length > 0) {
    context = docsToUse
      .map(
        (chunk) =>
          `[Source: ${chunk.metadata?.source || chunk.metadata?.loc?.pageNumber || "Unknown"}]\n${chunk.pageContent}`
      )
      .join("\n\n");
  } else {
    context = "No context found.";
  }

  const contextDescription = isWebSearch ? "real-time information retrieved from the web" : "the user's uploaded documents";
  const phrasingRule = isWebSearch 
    ? "Do not use phrases like 'Based on the provided documents' since you are sourcing this from a live web search."
    : "You may refer to the provided context as 'the provided documents'.";

  const systemPrompt = `You are Kikandai, an intelligent and highly capable assistant analyzing ${contextDescription}.

Your primary directive is to answer user queries using ONLY the information provided in the context below.

Rules for Interaction:
1. Be conversational, insightful, and helpful. Do not sound like a robotic search engine.
2. If the user asks a question that can be answered by the context, synthesize a clear, well-structured response using bullet points, bold text, and paragraphs. ${phrasingRule}
3. If the user asks for opinions, assumptions, or technical advice that goes beyond the provided text, politely acknowledge their question. Then, inform them that your current analysis is strictly limited to the provided information, which does not cover that specific topic.
4. NEVER invent information.

Context:
${context}`;

  const messages = [
    new SystemMessage(systemPrompt),
    ...(state.chatHistory || []).map(msg => 
      msg.role === "user" ? new HumanMessage(msg.content) : new AIMessage(msg.content)
    )
  ];

  const response = await llm.invoke(messages);

  return { generatedAnswer: response.content as string };
}
