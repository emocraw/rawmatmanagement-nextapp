import { NextResponse } from "next/server";
import { findUser, updateUserToken } from "@/lib/repo";
import { generateToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "").trim();

    if (!username || !password) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    const user = await findUser(username, password);
    if (!user) {
      return NextResponse.json({ message: "Login fail" }, { status: 400 });
    }

    const token = generateToken(username);
    await updateUserToken(username, token);

    return NextResponse.json({ ...user, token }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
