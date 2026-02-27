import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "Endpoint not available in legacy repository (missing checkIn.php)" }, { status: 501 });
}
