import "server-only";
import type { Methodology } from "@/lib/graph/types";
import { fetchPages } from "./fetch-database";
import { normalizePages } from "./normalize-pages";
import { checkbox, relation, select, text, title } from "./property-readers";

export async function fetchMethodologies(dataSourceId: string): Promise<Methodology[]> {
  return normalizePages("methodology", await fetchPages(dataSourceId), (page) => {
    const item = { id: page.id, title: title(page.properties.Ad), summary: text(page.properties["Özet"]), stage: select(page.properties["Aşama"]), topicIds: relation(page.properties.Konular), projectIds: relation(page.properties.Projeler), source: text(page.properties["Kaynak / Köken"]), hidden: checkbox(page.properties.Gizli) };
    return item.title ? item : undefined;
  });
}
