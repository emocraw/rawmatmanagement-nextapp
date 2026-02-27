export type AppEnv = {
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_ENCRYPT: boolean;
  DB_TRUST_CERT: boolean;
  DB_USER_MANAGEMENT: string;
  DB_MASTER_DATA: string;
  DB_GRADE_C: string;
  CORE_SAP_API: string;
};

/**
 * แปลงค่า string จาก env ให้เป็น boolean
 * รองรับ 1/true/yes/on (ไม่สนตัวพิมพ์เล็กใหญ่)
 * หากไม่มีค่า จะใช้ fallback ที่ส่งเข้ามา
 */
function readBool(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

/**
 * อ่านค่า env ตาม key ที่ระบุ
 * ถ้า env ไม่มีค่า จะใช้ fallback (ถ้ามี)
 * หากสุดท้ายยังไม่มีค่า จะ throw error เพื่อ fail fast ตอนเริ่มระบบ
 */
function readEnv(key: keyof NodeJS.ProcessEnv, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing env: ${key}`);
  }
  return value;
}

/**
 * ค่าคอนฟิกหลักของแอป อ่านครั้งเดียวตอนโหลดโมดูล
 * ใช้รวมการตั้งค่าฐานข้อมูลและ endpoint ภายนอก (SAP)
 */
export const env: AppEnv = {
  DB_HOST: readEnv("DB_HOST"),
  DB_PORT: Number(readEnv("DB_PORT", "1433")),
  DB_USER: readEnv("DB_USER"),
  DB_PASSWORD: readEnv("DB_PASSWORD"),
  DB_ENCRYPT: readBool(process.env.DB_ENCRYPT, false),
  DB_TRUST_CERT: readBool(process.env.DB_TRUST_CERT, true),
  DB_USER_MANAGEMENT: readEnv("DB_USER_MANAGEMENT", "User_Management"),
  DB_MASTER_DATA: readEnv("DB_MASTER_DATA", "Master_data"),
  DB_GRADE_C: readEnv("DB_GRADE_C", "Grade_C"),
  CORE_SAP_API: readEnv("CORE_SAP_API")
};
