import { NextResponse } from "next/server";
import { cancelGradeCById } from "@/lib/repo";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = Number(body.ID ?? 0);

    if (!id) {
      return NextResponse.json({ status: "Failed", message: "Missing ID" }, { status: 400 });
    }

    await cancelGradeCById(id);
    return NextResponse.json({ status: "Ok", message: "Cancel grade C Complete" });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
