import { NextResponse } from "next/server";
import { getBatchRawmatByProcessorderFG, insertGradeC } from "@/lib/repo";

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
    const processorder = String(body.processorder ?? "").trim();
    const batchRawmat = String(body.batchRawmat ?? "").trim();

    if (!cqty || !user || !machine || !batch || !matcode || !reasonCode || !groupMachine || !processorder) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    let lineReceiver = "";
    if (groupMachine === "PL") {
      lineReceiver = machine;
    } else if (batchRawmat) {
      lineReceiver = batchRawmat.slice(0, 3);
    } else {
      const rawmat = await getBatchRawmatByProcessorderFG(machine, processorder, batch);
      if (!rawmat?.Batch) {
        return NextResponse.json(
          { message: "Rawmat batch not found, please select rawmat batch manually" },
          { status: 400 }
        );
      }
      lineReceiver = String(rawmat.Batch).slice(0, 3);
    }

    await insertGradeC({
      processorder,
      batch,
      matcode,
      cqty,
      reasonCode,
      lineSender: machine,
      lineReceiver,
      sender: user,
      groupMachine
    });

    return NextResponse.json({ status: "Ok", message: "Update Data Complete" });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
