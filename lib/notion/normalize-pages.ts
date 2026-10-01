import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export function normalizePages<T>(label: string, pages: PageObjectResponse[], normalize: (page: PageObjectResponse) => T | undefined): T[] {
  return pages.flatMap((page) => {
    try {
      const item = normalize(page);
      if (!item) console.warn(`[notion] Skipping malformed ${label} record ${page.id}`);
      return item ? [item] : [];
    } catch (error) {
      console.error(`[notion] Skipping malformed ${label} record ${page.id}`, error);
      return [];
    }
  });
}
