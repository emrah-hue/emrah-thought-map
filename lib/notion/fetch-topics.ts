import "server-only";
import type { SourceNode } from "@/lib/graph/types";
import { fetchPages } from "./fetch-database";
import { select,text,title } from "./property-readers";
export async function fetchTopics(databaseId:string):Promise<SourceNode[]> {
  return (await fetchPages(databaseId)).map<SourceNode>(page=>({id:page.id,label:title(page.properties["Ad"]),nodeClass:"topic",subtype:select(page.properties["Konu Türü"]),summary:text(page.properties["Özet"])})).filter(n=>n.label);
}
