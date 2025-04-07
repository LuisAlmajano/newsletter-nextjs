import { NextRequest, NextResponse } from "next/server";
import supabase from "@/app/lib/supabase";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    console.log("Invalid token");
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const { data: record, error } = await supabase
    .from("pending_subscriptions")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !record) {
    console.log("Token not found");
    return NextResponse.json({ error: "Token not found" }, { status: 400 });
  }

  await supabase.from("subscribers").insert([{ email: record.email }]);

  await supabase.from("pending_subscriptions").delete().eq("token", token);

  return NextResponse.redirect(`${process.env.BASE_URL}/?approved=true`);
}
