import { NextResponse } from "next/server";
import { getGroupMachineByReasonCode } from "@/lib/repo";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const reasonCode = String(body.reasone_code ?? "").trim();

    if (!reasonCode) {
      return NextResponse.json({ message: "Data failed" }, { status: 400 });
    }

    const machines = await getGroupMachineByReasonCode(reasonCode);
    if (!machines.length) {
      return NextResponse.json({ message: "Machine group not found for this reason code" }, { status: 404 });
    }

    return NextResponse.json(machines, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
