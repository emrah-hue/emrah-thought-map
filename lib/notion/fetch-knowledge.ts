import "server-only";
import type { SourceNode } from "@/lib/graph/types";
import { fetchPublicPages } from "./fetch-database";
import { number,relation,select,text,title } from "./property-readers";
export async function fetchKnowledge(databaseId:string):Promise<SourceNode[]> {
  return (await fetchPublicPages(databaseId)).map<SourceNode>(page=>({id:page.id,label:title(page.properties["Ad"]),nodeClass:"knowledge",subtype:select(page.properties["Tür"]),stage:select(page.properties["Aşama"]),summary:text(page.properties["Özet"]),weight:number(page.properties["Ağırlık"]),topicIds:relation(page.properties["Konular"]),relatedIds:relation(page.properties["İlişkili Kayıtlar"]),visibility:select(page.properties["Görünürlük"])})).filter(n=>n.label);
}
