import "server-only";
import type { PageObjectResponse, QueryDatabaseParameters } from "@notionhq/client/build/src/api-endpoints";
import { notionClient } from "./client";

export async function fetchPages(databaseId:string){
  const pages:PageObjectResponse[]=[]; let cursor:string|undefined;
  do {
    const query:QueryDatabaseParameters={database_id:databaseId,start_cursor:cursor,page_size:100};
    const response=await notionClient().databases.query(query);
    pages.push(...response.results.filter((item):item is PageObjectResponse=>"properties" in item));
    cursor=response.has_more ? response.next_cursor ?? undefined : undefined;
  } while(cursor);
  return pages;
}
