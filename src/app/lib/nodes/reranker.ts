import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RagGraphState } from "../ragGraphState";
import { LLM_MODEL, RERANKER_TOP_K } from "../constants";
import { z } from "zod";

export async function reranker(state: typeof RagGraphState.State): Promise<Partial<typeof RagGraphState.State>> {
  if (!state.retrievedDocuments || state.retrievedDocuments.length === 0) {
    return { rerankedDocuments: [] };
  }

  const llm = new ChatGoogleGenerativeAI({
    model: LLM_MODEL,
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 1.0,
  });

  const rerankSchema = z.object({
    orderedIndices: z.array(z.number()),
  });

  const structuredLlm = llm.withStructuredOutput(rerankSchema, {
    method: "json_schema",
  });

  const documentsText = state.retrievedDocuments.map((doc, index) => `[Index ${index}]\n${doc.pageContent}`).join("\n\n");

  const prompt = `Score each document chunk 1-10 on relevance to this query: "${state.rewrittenQuery}". 
Return an ordered list of chunk indices, from most relevant to least relevant.

Documents:
${documentsText}`;

  try {
    const result = await structuredLlm.invoke(prompt);
    
    const orderedDocs = result.orderedIndices
      .map(index => state.retrievedDocuments[index])
      .filter(doc => doc !== undefined)
      .slice(0, RERANKER_TOP_K);

    return { rerankedDocuments: orderedDocs.length > 0 ? orderedDocs : state.retrievedDocuments.slice(0, RERANKER_TOP_K) };
  } catch (error) {
    return { rerankedDocuments: state.retrievedDocuments.slice(0, RERANKER_TOP_K) };
  }
}
