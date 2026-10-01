import "server-only";
import type { MethodologyRelationship, MethodologyRelationType } from "@/lib/graph/types";
import { fetchPages } from "./fetch-database";
import { normalizePages } from "./normalize-pages";
import { relation, select, text } from "./property-readers";

const RELATION_TYPES = new Set<MethodologyRelationType>(["Besler", "Kapsar", "Tamamlar", "Derinleştirir"]);
export async function fetchMethodologyRelationships(dataSourceId: string): Promise<MethodologyRelationship[]> {
  return normalizePages("methodology relationship", await fetchPages(dataSourceId), (page) => {
    const sourceMethodologyId = relation(page.properties["Kaynak Metodoloji"])[0];
    const targetMethodologyId = relation(page.properties["Hedef Metodoloji"])[0];
    const relationType = select(page.properties["İlişki Türü"]);
    if (!sourceMethodologyId || !targetMethodologyId || !RELATION_TYPES.has(relationType as MethodologyRelationType)) return undefined;
    return { id: page.id, sourceMethodologyId, targetMethodologyId, relationType: relationType as MethodologyRelationType, description: text(page.properties["Açıklama"]) || undefined };
  });
}
