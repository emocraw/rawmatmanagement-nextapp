import { NextResponse } from "next/server";
import { getWipConfirmedByDate } from "@/lib/repo";
import { getShiftRange } from "@/lib/shift";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const date = String(body.date ?? "").trim();
    const shift = String(body.shift ?? "").trim();
    const machine = String(body.machine ?? "").trim();

    if (!date || !shift || !machine) {
      return NextResponse.json({ message: "Data failed" }, { status: 400 });
    }

    const { dateStart, dateEnd } = getShiftRange(date, shift);
    const data = await getWipConfirmedByDate(machine, dateStart, dateEnd);

    if (!data.length) {
      return NextResponse.json({ message: "data not found" }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
