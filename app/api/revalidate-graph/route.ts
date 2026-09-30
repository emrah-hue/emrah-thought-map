import { revalidateTag } from "next/cache";
import { NextRequest,NextResponse } from "next/server";
export async function POST(request:NextRequest){
  const configured=process.env.CRON_SECRET;
  const supplied=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"") ?? request.headers.get("x-cron-secret");
  if(!configured || supplied!==configured) return NextResponse.json({error:"Unauthorized"},{status:401});
  revalidateTag("public-thought-graph");
  return NextResponse.json({revalidated:true,at:new Date().toISOString()});
}
