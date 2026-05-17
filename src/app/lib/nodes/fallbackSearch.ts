import { RagGraphState } from "../ragGraphState";
import { Document } from "@langchain/core/documents";
import { WEB_SEARCH_ENABLED } from "../constants";

export async function fallbackSearch(state: typeof RagGraphState.State): Promise<Partial<typeof RagGraphState.State>> {
  if (!WEB_SEARCH_ENABLED || !process.env.TAVILY_API_KEY) {
    return { webSearchResults: [] };
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: state.rewrittenQuery,
        search_depth: "basic",
        max_results: 3,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily search failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    const webDocs = data.results.map((result: any) => new Document({
      pageContent: result.content,
      metadata: { source: result.url, title: result.title, isWebSearch: true },
    }));

    return { webSearchResults: webDocs };
  } catch (error) {
    return { webSearchResults: [] };
  }
}
