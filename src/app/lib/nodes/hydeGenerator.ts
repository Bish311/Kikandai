import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RagGraphState } from "../ragGraphState";
import { LLM_MODEL, HYDE_ENABLED } from "../constants";

export async function hydeGenerator(state: typeof RagGraphState.State): Promise<Partial<typeof RagGraphState.State>> {
  if (!HYDE_ENABLED) {
    return { hydeDocument: state.rewrittenQuery };
  }

  const llm = new ChatGoogleGenerativeAI({
    model: LLM_MODEL,
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 1.0,
  });

  const prompt = `Given this question, write a short hypothetical paragraph that would perfectly answer it. This will be used for embedding-based retrieval.
  
Question: ${state.rewrittenQuery}
  
Hypothetical Answer:`;

  const response = await llm.invoke(prompt);
  
  return { hydeDocument: response.content as string };
}
