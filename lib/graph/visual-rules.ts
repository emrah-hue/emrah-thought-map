import type { NodeClass } from "./types";

export const VISUAL_RULES = {
  defaultWeight: 3, baseSize: { topic: 5.5, knowledge: 6.5 } satisfies Record<NodeClass,number>,
  weightStep: 2.15, maxCentralityBonus: 2.2,
  stageSize: { "Tohum":-1.2, "Geliştiriliyor":1, "Deneniyor":1.2, "Uygulamada":1.6, "Yerleşik":.7 } as Record<string,number>,
  stageOpacity: { "Tohum":.72, "Geliştiriliyor":1, "Deneniyor":1, "Uygulamada":1, "Yerleşik":.9 } as Record<string,number>,
};
export function nodeSize(nodeClass:NodeClass, weight:number|undefined, stage:string|undefined, degree:number) {
  const safeWeight=Math.min(5,Math.max(1,weight ?? VISUAL_RULES.defaultWeight));
  return VISUAL_RULES.baseSize[nodeClass]+safeWeight*VISUAL_RULES.weightStep+(VISUAL_RULES.stageSize[stage ?? ""] ?? 0)+Math.min(VISUAL_RULES.maxCentralityBonus,Math.sqrt(degree)*.55);
}
export const nodeOpacity=(stage?:string)=>VISUAL_RULES.stageOpacity[stage ?? ""] ?? .9;
