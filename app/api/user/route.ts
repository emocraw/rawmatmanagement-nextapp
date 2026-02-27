import { NextResponse } from "next/server";
import { getUserByToken } from "@/lib/repo";
import { getBearerToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.function && body.function !== "getUser") {
      return NextResponse.json({ message: "Function not found" }, { status: 400 });
    }

    const token = getBearerToken(req.headers);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userInfo = await getUserByToken(token);
    return NextResponse.json(userInfo, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
