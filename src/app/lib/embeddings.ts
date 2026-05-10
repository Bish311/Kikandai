import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { EMBEDDING_MODEL } from "./constants";

export const getEmbeddings = () => {
  return new GoogleGenerativeAIEmbeddings({
    model: EMBEDDING_MODEL,
    apiKey: process.env.GOOGLE_API_KEY,
  });
};
