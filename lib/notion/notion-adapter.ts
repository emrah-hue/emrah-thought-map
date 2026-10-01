import "server-only";
import type { NormalizedSecondBrain } from "@/lib/graph/types";
import { fetchInterestAreas } from "./fetch-interest-areas";
import { fetchMethodologies } from "./fetch-methodologies";
import { fetchMethodologyRelationships } from "./fetch-methodology-relationships";
import { fetchProjects } from "./fetch-projects";
import { fetchTopics } from "./fetch-topics";

const requiredEnv = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} tanımlı değil.`);
  return value;
};

export async function fetchNotionSource(): Promise<NormalizedSecondBrain> {
  const ids = {
    interestAreas: requiredEnv("NOTION_INTEREST_AREAS_DATA_SOURCE_ID"),
    topics: requiredEnv("NOTION_TOPICS_DATA_SOURCE_ID"),
    methodologies: requiredEnv("NOTION_METHODOLOGIES_DATA_SOURCE_ID"),
    projects: requiredEnv("NOTION_PROJECTS_DATA_SOURCE_ID"),
    methodologyRelationships: requiredEnv("NOTION_METHODOLOGY_RELATIONSHIPS_DATA_SOURCE_ID"),
  };
  const [interestAreas, topics, methodologies, projects, methodologyRelationships] = await Promise.all([
    fetchInterestAreas(ids.interestAreas), fetchTopics(ids.topics), fetchMethodologies(ids.methodologies), fetchProjects(ids.projects), fetchMethodologyRelationships(ids.methodologyRelationships),
  ]);
  return { interestAreas, topics, methodologies, projects, methodologyRelationships };
}
