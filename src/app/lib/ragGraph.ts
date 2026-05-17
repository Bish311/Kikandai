import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { RagGraphState } from "./ragGraphState";
import { queryRewriter } from "./nodes/queryRewriter";
import { hydeGenerator } from "./nodes/hydeGenerator";
import { retriever } from "./nodes/retriever";
import { reranker } from "./nodes/reranker";
import { evaluator } from "./nodes/evaluator";
import { fallbackSearch } from "./nodes/fallbackSearch";
import { generator } from "./nodes/generator";

const checkpointer = new MemorySaver();

export function compileGraph() {
  const graphBuilder = new StateGraph(RagGraphState)
    .addNode("queryRewriter", queryRewriter)
    .addNode("hydeGenerator", hydeGenerator)
    .addNode("retriever", retriever)
    .addNode("reranker", reranker)
    .addNode("evaluator", evaluator)
    .addNode("fallbackSearch", fallbackSearch)
    .addNode("generator", generator)
    
    .addEdge(START, "queryRewriter")
    .addEdge("queryRewriter", "hydeGenerator")
    .addEdge("hydeGenerator", "retriever")
    .addEdge("retriever", "reranker")
    .addEdge("reranker", "evaluator")
    
    .addConditionalEdges("evaluator", (state) => state.evaluationScore, {
      CORRECT: "generator",
      AMBIGUOUS: "generator",
      INCORRECT: "fallbackSearch",
    })
    
    .addEdge("fallbackSearch", "generator")
    .addEdge("generator", END);

  return graphBuilder.compile({ checkpointer });
}
