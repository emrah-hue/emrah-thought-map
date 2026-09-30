import "server-only";
import { Client } from "@notionhq/client";

let client:Client|undefined;
export function notionClient(){
  if(!process.env.NOTION_TOKEN) throw new Error("NOTION_TOKEN tanımlı değil.");
  return client ??= new Client({auth:process.env.NOTION_TOKEN});
}
