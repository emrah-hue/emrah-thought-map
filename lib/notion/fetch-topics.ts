import "server-only";
import type { Topic } from "@/lib/graph/types";
import { fetchPages } from "./fetch-database";
import { normalizePages } from "./normalize-pages";
import { checkbox, relation, text, title } from "./property-readers";

export async function fetchTopics(dataSourceId: string): Promise<Topic[]> {
  return normalizePages("topic", await fetchPages(dataSourceId), (page) => {
    const item = { id: page.id, title: title(page.properties.Ad), summary: text(page.properties["Özet"]), interestAreaIds: relation(page.properties["İlgi Alanları"]), methodologyIds: relation(page.properties.Metodolojiler), projectIds: relation(page.properties.Projeler), hidden: checkbox(page.properties.Gizli) };
    return item.title ? item : undefined;
  });
}
