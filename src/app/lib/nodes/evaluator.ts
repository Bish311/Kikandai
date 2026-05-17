import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RagGraphState } from "../ragGraphState";
import { LLM_MODEL } from "../constants";
import { z } from "zod";

export async function evaluator(state: typeof RagGraphState.State): Promise<Partial<typeof RagGraphState.State>> {
  if (!state.rerankedDocuments || state.rerankedDocuments.length === 0) {
    return { evaluationScore: "INCORRECT" };
  }

  const llm = new ChatGoogleGenerativeAI({
    model: LLM_MODEL,
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 1.0,
  });

  const evaluationSchema = z.object({
    score: z.enum(["CORRECT", "INCORRECT", "AMBIGUOUS"]),
  });

  const structuredEvaluator = llm.withStructuredOutput(evaluationSchema, {
    method: "json_schema",
  });

  const documentsText = state.rerankedDocuments.map(doc => doc.pageContent).join("\n\n");

  const prompt = `Evaluate if these document chunks contain sufficient information to answer the query: "${state.rewrittenQuery}".
Return EXACTLY one of: { score: 'CORRECT' } | { score: 'INCORRECT' } | { score: 'AMBIGUOUS' }.

Documents:
${documentsText}`;

  try {
    const result = await structuredEvaluator.invoke(prompt);
    return { evaluationScore: result.score };
  } catch (error) {
    return { evaluationScore: "CORRECT" };
  }
}
