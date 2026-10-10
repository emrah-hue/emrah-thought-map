import "server-only";
import type { Project } from "@/lib/graph/types";
import { fetchPages } from "./fetch-database";
import { normalizePages } from "./normalize-pages";
import { checkbox, relation, select, text, title } from "./property-readers";

export async function fetchProjects(dataSourceId: string): Promise<Project[]> {
  return normalizePages("project", await fetchPages(dataSourceId), (page) => {
    const item = { id: page.id, title: title(page.properties.Ad), summary: text(page.properties["Özet"]), type: select(page.properties["Tür"]), status: select(page.properties.Durum), topicIds: relation(page.properties.Konular), methodologyIds: relation(page.properties.Metodolojiler), hidden: checkbox(page.properties.Gizli) };
    return item.title ? { ...item, relatedProjectIds: relation(page.properties["İlgili Projeler"]) } : undefined;
  });
}
