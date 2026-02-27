import { NextResponse } from "next/server";
import { updateStatusQrPrdInput } from "@/lib/repo";

type QrItem = { QR?: string };

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const qrs = body.qrs as QrItem[];
    const user = String(body.user ?? "").trim();
    const processorder = String(body.processorder ?? "").trim();
    const machine = String(body.machine ?? "").trim();

    if (!Array.isArray(qrs) || !qrs.length || !user || !processorder || !machine) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    for (const item of qrs) {
      const qr = String(item.QR ?? "").trim();
      if (!qr) continue;
      await updateStatusQrPrdInput(machine, qr, processorder, user);
    }

    return NextResponse.json({ status: "Ok", message: "Update Data Complete" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
