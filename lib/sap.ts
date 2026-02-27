import { env } from "@/lib/env";

export type Cor3Response = {
  type?: string;
  message?: string;
  header?: {
    material?: string;
    production_scheduler?: string;
  };
  component?: Array<{ material: string }>;
};

/**
 * ฟังก์ชันกลางสำหรับเรียก SAP API แบบ POST
 * รองรับ query string เพิ่มเติม และ throw error เมื่อ response ไม่สำเร็จ
 */
async function callSap(payload: object, query?: Record<string, string>): Promise<any> {
  const queryString = query
    ? `?${new URLSearchParams(query).toString()}`
    : "";

  const response = await fetch(`${env.CORE_SAP_API}${queryString}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`SAP request failed (${response.status})`);
  }

  return response.json();
}

/**
 * เรียก SAP function getCor3 เพื่อดึงรายละเอียด process order
 */
export async function getCor3(processorder: string): Promise<Cor3Response> {
  return callSap({ function: "getCor3" }, { orderno: processorder });
}

/**
 * เรียก SAP function MB51 เพื่อค้น process order จาก matcode + batch
 */
export async function getMB51(matcode: string, batch: string): Promise<any> {
  return callSap({ function: "MB51", material: matcode, batch });
}
