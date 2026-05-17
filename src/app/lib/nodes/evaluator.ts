import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RagGraphState } from "../ragGraphState";
import { LLM_MODEL } from "../constants";
import { z } from "zod";

const EVALUATOR_TEMPERATURE = 0.1;

export async function evaluator(state: typeof RagGraphState.State): Promise<Partial<typeof RagGraphState.State>> {
  if (!state.rerankedDocuments || state.rerankedDocuments.length === 0) {
    return { evaluationScore: "INCORRECT" };
  }

  const llm = new ChatGoogleGenerativeAI({
    model: LLM_MODEL,
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: EVALUATOR_TEMPERATURE,
  });

  const evaluationSchema = z.object({
    score: z.enum(["CORRECT", "INCORRECT", "AMBIGUOUS"]),
  });

  const structuredEvaluator = llm.withStructuredOutput(evaluationSchema, {
    method: "json_schema",
  });

  const documentsText = state.rerankedDocuments.map(doc => doc.pageContent).join("\n\n");

  const prompt = `You are a strict relevance judge. Your job is to determine if the retrieved document chunks can DIRECTLY and SPECIFICALLY answer the user's query.

IMPORTANT RULES:
- If the query asks about real-time events, current news, live data, specific dates "this week/today/recently", or information that changes frequently (stock prices, trending topics, latest discoveries), and the documents do NOT contain that exact up-to-date information, you MUST return INCORRECT.
- If the documents only mention the general TOPIC but do NOT contain the SPECIFIC facts, numbers, names, or details needed to answer the query, return INCORRECT.
- Return CORRECT only if the documents contain enough specific information to fully answer the query.
- Return AMBIGUOUS only if the documents partially answer the query with some relevant details but not all.

Query: "${state.rewrittenQuery}"

Documents:
${documentsText}`;

  try {
    const result = await structuredEvaluator.invoke(prompt);
    return { evaluationScore: result.score };
  } catch (error) {
    return { evaluationScore: "CORRECT" };
  }
}
