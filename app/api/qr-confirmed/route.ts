import { NextResponse } from "next/server";
import { getQr } from "@/lib/repo";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const qr = String(body.qr ?? "").trim();
    const machine = String(body.machine ?? "").trim();

    if (!qr || !machine) {
      return NextResponse.json({ message: "Data failed" }, { status: 400 });
    }

    const qrDetail = await getQr(machine, qr, true);
    if (!qrDetail.length) {
      return NextResponse.json({ message: "data not found" }, { status: 400 });
    }

    if (!qrDetail[0].statusout) {
      return NextResponse.json({ message: "QR code has not been confirmed by movement 261" }, { status: 400 });
    }

    return NextResponse.json(qrDetail, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
