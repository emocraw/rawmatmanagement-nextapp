import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { message: "Endpoint not available in legacy repository (missing getTop200Checkin.php)" },
    { status: 501 }
  );
}
