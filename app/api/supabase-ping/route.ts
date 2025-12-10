// app/api/supabase-ping/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Use an RPC that always exists in Postgres
    const { data, error } = await supabase.rpc("version");

    if (error) {
      return NextResponse.json(
        { ok: false, message: "Ping failed", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: true, message: "Supabase ping succeeded", postgresVersion: data },
      { status: 200 }
    );

  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}
