import { NextResponse } from "next/server";
import { getCor3 } from "@/lib/sap";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const processorder = String(body.processorder ?? "").trim();
    const machine = String(body.machine ?? "").trim();

    if (!processorder || !machine) {
      return NextResponse.json({ message: "Data failed" }, { status: 400 });
    }

    const cor3Det = await getCor3(processorder);

    if (cor3Det.type) {
      return NextResponse.json({ message: cor3Det.message ?? "SAP error" }, { status: 400 });
    }

    const fgMatcode = cor3Det.header?.material ?? "";
    const productionScheduler = cor3Det.header?.production_scheduler ?? "";

    if (productionScheduler !== machine) {
      return NextResponse.json(
        { message: `Processorder does not belong to machine ${machine}` },
        { status: 400 }
      );
    }

    if (fgMatcode.startsWith("0")) {
      return NextResponse.json(
        { message: "Tile processorders are not supported yet" },
        { status: 400 }
      );
    }

    const rawmatWip = (cor3Det.component ?? [])
      .map((item) => item.material)
      .filter((material) => material && !material.startsWith("0"));

    if (!rawmatWip.length) {
      return NextResponse.json(
        { message: "No WIP raw material found in this processorder" },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "success", rawmatWip }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
