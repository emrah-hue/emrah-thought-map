import "server-only";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

type QueryDataSourceResponse = {
  results: unknown[];
  has_more: boolean;
  next_cursor: string | null;
  code?: string;
  message?: string;
};

const isPageObject = (value: unknown): value is PageObjectResponse =>
  typeof value === "object" && value !== null && "properties" in value;

export async function fetchPages(dataSourceId: string) {
  const id = dataSourceId.replace(/^collection:\/\//, "");
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error("NOTION_TOKEN tanımlı değil.");

  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const response = await fetch(`https://api.notion.com/v1/data_sources/${id}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Notion-Version": "2025-09-03",
      },
      body: JSON.stringify({
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      }),
      cache: "no-store",
    });

    const payload = (await response.json()) as QueryDataSourceResponse;
    if (!response.ok) {
      throw new Error(
        `[notion] data source query failed (${response.status}${payload.code ? ` ${payload.code}` : ""}): ${payload.message ?? response.statusText}`,
      );
    }

    pages.push(...payload.results.filter(isPageObject));
    cursor = payload.has_more ? payload.next_cursor ?? undefined : undefined;
  } while (cursor);

  return pages;
}
