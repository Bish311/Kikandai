import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RagGraphState } from "../ragGraphState";
import { LLM_MODEL } from "../constants";

export async function queryRewriter(state: typeof RagGraphState.State): Promise<Partial<typeof RagGraphState.State>> {
  const llm = new ChatGoogleGenerativeAI({
    model: LLM_MODEL,
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 1.0,
  });

  const prompt = `Rewrite this conversational question into a concise, keyword-rich query optimized for semantic vector database search. Remove filler words, expand abbreviations, add implicit context.
  
Question: ${state.originalQuery}
  
Rewritten Query:`;

  const response = await llm.invoke(prompt);
  
  return { rewrittenQuery: response.content as string };
}
