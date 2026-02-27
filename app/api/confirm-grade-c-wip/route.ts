import { NextResponse } from "next/server";
import { insertGradeC } from "@/lib/repo";
import { getMB51 } from "@/lib/sap";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const cqty = Number(body.cqty ?? 0);
    const user = String(body.user ?? "").trim();
    const machine = String(body.machine ?? "").trim();
    const batch = String(body.batch ?? "").trim();
    const matcode = String(body.matcode ?? "").trim();
    const reasonCode = String(body.creason ?? "").trim();
    const groupMachine = String(body.groupMc ?? "").trim();

    if (!cqty || !user || !machine || !batch || !matcode || !reasonCode || !groupMachine) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    const mb51 = await getMB51(matcode, batch);
    const processorder = String(mb51?.order_list?.[0]?.process_order ?? "");

    await insertGradeC({
      processorder,
      batch,
      matcode,
      cqty,
      reasonCode,
      lineSender: machine,
      lineReceiver: batch.slice(0, 3),
      sender: user,
      groupMachine
    });

    return NextResponse.json({ status: "Ok", message: "Update Data Complete" });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
