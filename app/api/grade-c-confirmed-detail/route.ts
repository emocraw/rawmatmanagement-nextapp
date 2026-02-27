import { NextResponse } from "next/server";
import { getGradeCConfirmedDetail } from "@/lib/repo";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const batch = String(body.batch ?? "").trim();
    const matcode = String(body.matcode ?? "").trim();

    if (!batch || !matcode) {
      return NextResponse.json({ message: "Data failed" }, { status: 400 });
    }

    const data = await getGradeCConfirmedDetail(batch, matcode);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
