import { RagGraphState } from "../ragGraphState";
import { getVectorStore } from "../vectorStore";
import { RETRIEVAL_K, HYDE_ENABLED } from "../constants";

export async function retriever(state: typeof RagGraphState.State): Promise<Partial<typeof RagGraphState.State>> {
  const vectorStore = await getVectorStore();
  
  const query = HYDE_ENABLED && state.hydeDocument ? state.hydeDocument : state.rewrittenQuery;
  
  const retrievedChunks = await vectorStore.similaritySearch(query, RETRIEVAL_K, {
    preFilter: { documentId: { $in: state.documentIds } },
  });
  
  return { retrievedDocuments: retrievedChunks };
}
