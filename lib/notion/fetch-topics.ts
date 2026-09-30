import "server-only";
import type { SourceNode } from "@/lib/graph/types";
import { fetchPublicPages } from "./fetch-database";
import { number,select,text,title } from "./property-readers";
export async function fetchTopics(databaseId:string):Promise<SourceNode[]> {
  return (await fetchPublicPages(databaseId)).map<SourceNode>(page=>({id:page.id,label:title(page.properties["Ad"]),nodeClass:"topic",subtype:select(page.properties["Konu Türü"]),summary:text(page.properties["Özet"]),weight:number(page.properties["Ağırlık"]),visibility:select(page.properties["Görünürlük"])})).filter(n=>n.label);
}
