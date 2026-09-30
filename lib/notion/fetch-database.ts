import "server-only";
import type { PageObjectResponse, QueryDatabaseParameters } from "@notionhq/client/build/src/api-endpoints";
import { notionClient } from "./client";

export async function fetchPublicPages(databaseId:string){
  const pages:PageObjectResponse[]=[]; let cursor:string|undefined;
  do {
    const query:QueryDatabaseParameters={database_id:databaseId,start_cursor:cursor,page_size:100,filter:{property:"Görünürlük",select:{equals:"Kamusal"}}};
    const response=await notionClient().databases.query(query);
    pages.push(...response.results.filter((item):item is PageObjectResponse=>"properties" in item));
    cursor=response.has_more ? response.next_cursor ?? undefined : undefined;
  } while(cursor);
  return pages;
}
