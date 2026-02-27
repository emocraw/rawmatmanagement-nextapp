import crypto from "node:crypto";

/**
 * สร้าง token สำหรับ session ผู้ใช้จาก username + timestamp + random salt
 * แล้ว hash ด้วย SHA-256 เพื่อให้ได้ค่า token แบบคาดเดายาก
 */
export function generateToken(username: string): string {
  const timestamp = new Date().toISOString().replace(/[\D]/g, "").slice(0, 14);
  const raw = `${username}|Fac4|${timestamp}|${crypto.randomBytes(5).toString("hex")}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * อ่าน Bearer token จาก request headers
 * คืนค่า token ถ้า format ถูกต้อง (Authorization: Bearer <token>)
 * หากไม่ถูกต้องคืนค่า null
 */
export function getBearerToken(headers: Headers): string | null {
  const auth = headers.get("authorization") ?? "";
  const [scheme, token] = auth.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }
  return token;
}
