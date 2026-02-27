import sql, { config as SqlConfig, ConnectionPool } from "mssql";
import { env } from "@/lib/env";

const poolCache = new Map<string, Promise<ConnectionPool>>();

const MACHINE_DATABASES = new Set(["PL1", "PL3", "PL4", "PL5"]);

/**
 * ตรวจสอบชื่อฐานข้อมูลว่าอยู่ใน allow-list ที่ระบบอนุญาต
 * เพื่อกันการเชื่อมต่อ DB ที่ไม่ตั้งใจหรือ input ผิด
 */
export function assertDatabaseName(database: string): string {
  const allowed = new Set([env.DB_USER_MANAGEMENT, env.DB_MASTER_DATA, env.DB_GRADE_C, ...MACHINE_DATABASES]);
  if (!allowed.has(database)) {
    throw new Error(`Database ${database} is not allowed`);
  }
  return database;
}

/**
 * คืนรายชื่อฐานข้อมูลของไลน์เครื่องที่ระบบรองรับ
 * ใช้สำหรับ validation และ UI ที่ต้องเลือก machine
 */
export function getMachineDatabases(): string[] {
  return [...MACHINE_DATABASES];
}

/**
 * คืน connection pool ของฐานข้อมูลที่ระบุ
 * - ถ้าเคยสร้างแล้วจะคืนจาก cache
 * - ถ้ายังไม่เคย จะสร้างใหม่และเก็บไว้ใน cache
 */
export async function getPool(database: string): Promise<ConnectionPool> {
  const db = assertDatabaseName(database);
  const cached = poolCache.get(db);
  if (cached) {
    return cached;
  }

  const config: SqlConfig = {
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    server: env.DB_HOST,
    port: env.DB_PORT,
    database: db,
    options: {
      encrypt: env.DB_ENCRYPT,
      trustServerCertificate: env.DB_TRUST_CERT
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30_000
    }
  };

  const connection = new sql.ConnectionPool(config).connect();
  poolCache.set(db, connection);
  return connection;
}
