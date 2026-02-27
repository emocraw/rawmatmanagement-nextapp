import { NextResponse } from "next/server";
import { getReasonCFeedIn } from "@/lib/repo";

export async function GET() {
  try {
    const data = await getReasonCFeedIn();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
