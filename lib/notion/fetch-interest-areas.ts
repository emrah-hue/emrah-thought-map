import "server-only";
import type { InterestArea } from "@/lib/graph/types";
import { fetchPages } from "./fetch-database";
import { normalizePages } from "./normalize-pages";
import { checkbox, relation, text, title } from "./property-readers";

export async function fetchInterestAreas(dataSourceId: string): Promise<InterestArea[]> {
  return normalizePages("interest area", await fetchPages(dataSourceId), (page) => {
    const item = { id: page.id, title: title(page.properties.Ad), summary: text(page.properties["Özet"]), topicIds: relation(page.properties.Konular), hidden: checkbox(page.properties.Gizli) };
    return item.title ? item : undefined;
  });
}
