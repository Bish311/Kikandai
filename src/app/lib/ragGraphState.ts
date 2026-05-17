import { Annotation } from "@langchain/langgraph";
import { Document } from "@langchain/core/documents";

export const RagGraphState = Annotation.Root({
  originalQuery: Annotation<string>,
  rewrittenQuery: Annotation<string>,
  hydeDocument: Annotation<string>,
  retrievedDocuments: Annotation<Document[]>,
  rerankedDocuments: Annotation<Document[]>,
  evaluationScore: Annotation<"CORRECT" | "INCORRECT" | "AMBIGUOUS">,
  webSearchResults: Annotation<Document[]>,
  generatedAnswer: Annotation<string>,
  chatHistory: Annotation<Array<{ role: string; content: string }>>,
  documentIds: Annotation<string[]>,
  threadId: Annotation<string>,
});
