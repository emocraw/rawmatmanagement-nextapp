import { NextResponse } from "next/server";
import { getACOutputByBatch } from "@/lib/repo";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const batch = String(body.batch ?? "").trim();
    const processorder = String(body.processorder ?? "").trim();
    const machine = String(body.machine ?? "").trim();

    if (!batch || !processorder || !machine) {
      return NextResponse.json({ message: "Data failed" }, { status: 400 });
    }

    const data = await getACOutputByBatch(machine, processorder, batch);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
