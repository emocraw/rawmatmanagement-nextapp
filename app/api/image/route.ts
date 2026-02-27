import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "Endpoint not available in legacy repository (missing getImage.php)" }, { status: 501 });
}
