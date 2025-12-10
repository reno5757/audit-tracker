// app/api/supabase-ping/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // 👇 Replace "your_table" with a small table that always exists
    const { data, error } = await supabase
      .from("projects")            
      .select("id")
      .limit(1);

    if (error) {
      return NextResponse.json(
        { ok: false, message: "Ping failed", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Supabase ping succeeded",
        rows: data?.length ?? 0,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}
