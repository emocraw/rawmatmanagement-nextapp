import { NextResponse } from "next/server";
import { getRawmatBatchByProcessorder } from "@/lib/repo";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const processorder = String(body.processorder ?? "").trim();
    const machine = String(body.machine ?? "").trim();

    if (!processorder || !machine) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    const data = await getRawmatBatchByProcessorder(machine, processorder);
    if (!data.length) {
      return NextResponse.json({ message: "No rawmat batch found for this processorder" }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
