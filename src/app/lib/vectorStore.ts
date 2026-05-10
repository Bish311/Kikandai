import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { getDatabase } from "./mongodb";
import { getEmbeddings } from "./embeddings";
import { COLLECTION_NAME, INDEX_NAME } from "./constants";

export async function getVectorStore() {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);
  const embeddings = getEmbeddings();

  return new MongoDBAtlasVectorSearch(embeddings, {
    collection: collection as any,
    indexName: INDEX_NAME,
    textKey: "text",
    embeddingKey: "embedding",
  });
}
