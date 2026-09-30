import "server-only";
import type { SourceNode } from "@/lib/graph/types";
import { fetchPages } from "./fetch-database";
import { relation,select,text,title } from "./property-readers";
export async function fetchKnowledge(databaseId:string):Promise<SourceNode[]> {
  return (await fetchPages(databaseId)).map<SourceNode>(page=>({id:page.id,label:title(page.properties["Ad"]),nodeClass:"knowledge",subtype:select(page.properties["Tür"]),stage:select(page.properties["Aşama"]),summary:text(page.properties["Özet"]),topicIds:relation(page.properties["Konular"]),relatedIds:relation(page.properties["İlişkili Kayıtlar"])})).filter(n=>n.label);
}
