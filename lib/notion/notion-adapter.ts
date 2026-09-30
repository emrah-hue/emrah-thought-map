import "server-only";
import { fetchKnowledge } from "./fetch-knowledge";
import { fetchTopics } from "./fetch-topics";
export async function fetchNotionSource(){
  const topicsId=process.env.NOTION_TOPICS_DATABASE_ID, knowledgeId=process.env.NOTION_KNOWLEDGE_DATABASE_ID;
  if(!topicsId || !knowledgeId) throw new Error("Notion database ID'leri tanımlı değil.");
  const [topics,knowledge]=await Promise.all([fetchTopics(topicsId),fetchKnowledge(knowledgeId)]);
  return [...topics,...knowledge];
}
