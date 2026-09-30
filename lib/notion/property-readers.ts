import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
type Prop=PageObjectResponse["properties"][string];
export const title=(p:Prop|undefined)=>p?.type==="title"?p.title.map(v=>v.plain_text).join("").trim():"";
export const text=(p:Prop|undefined)=>p?.type==="rich_text"?p.rich_text.map(v=>v.plain_text).join("").trim():"";
export const select=(p:Prop|undefined)=>p?.type==="select"?(p.select?.name??""):p?.type==="status"?(p.status?.name??""):"";
export const number=(p:Prop|undefined)=>p?.type==="number"?(p.number??undefined):undefined;
export const relation=(p:Prop|undefined)=>p?.type==="relation"?p.relation.map(v=>v.id):[];
