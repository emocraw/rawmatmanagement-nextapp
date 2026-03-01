"use client";

import { useEffect, useMemo, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { GradeCActionForm } from "@/components/GradeCActionForm";
import { PageLoader } from "@/components/PageLoader";
import { SelectableDataTable, type SelectableTableColumn } from "@/components/SelectableDataTable";
import { WorkFilterBar } from "@/components/WorkFilterBar";
import { useSessionGuard } from "@/hooks/useSessionGuard";

type WipRow = { Batch: string; Matcode: string; qty: number; cqty: number; processorder: string; BatchPL: string };
type GradeCDetail = { ID: number; Material: string; Batch: string; Reason_Name: string; GroupMachine: string; C_Qty: number; English_Name: string };
type ReasonOption = { Reason_Code: string; Reason_Name: string };
type GroupOption = { id: string | number; sub_proces: string };

export default function ConfirmCFeedInPage() {
  const session = useSessionGuard();
  const [workDate, setWorkDate] = useState("");
  const [shift, setShift] = useState("night");
  const [rows, setRows] = useState<WipRow[]>([]);
  const [selected, setSelected] = useState<WipRow | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [details, setDetails] = useState<GradeCDetail[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<GradeCDetail | null>(null);
  const [reasons, setReasons] = useState<ReasonOption[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [reasonC, setReasonC] = useState("");
  const [groupMc, setGroupMc] = useState("");
  const [cqty, setCqty] = useState("");
  const [acOutput, setAcOutput] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const totals = useMemo(
    () => rows.reduce((acc, row) => ({ qty: acc.qty + Number(row.qty || 0), cqty: acc.cqty + Number(row.cqty || 0) }), { qty: 0, cqty: 0 }),
    [rows]
  );
  const rowKey = (row: WipRow) => `${row.Batch}|${row.Matcode}|${row.processorder}`;
  const detailRowKey = (row: GradeCDetail) => String(row.ID);

  const wipColumns: SelectableTableColumn<WipRow>[] = [
    { key: "batch", header: "Batch", renderCell: (row) => row.Batch },
    { key: "matcode", header: "Matcode", renderCell: (row) => row.Matcode },
    { key: "qty", header: "Quantity", renderCell: (row) => row.qty },
    { key: "cqty", header: "C Qty", renderCell: (row) => row.cqty || 0 },
    { key: "processorder", header: "Work order", renderCell: (row) => row.processorder },
    { key: "batchpl", header: "Work batch", renderCell: (row) => row.BatchPL }
  ];

  const detailColumns: SelectableTableColumn<GradeCDetail>[] = [
    { key: "material", header: "Matcode", renderCell: (row) => row.Material },
    { key: "batch", header: "Batch", renderCell: (row) => row.Batch },
    { key: "reason", header: "Reason_Code", renderCell: (row) => row.Reason_Name },
    { key: "group", header: "Group Machine", renderCell: (row) => row.GroupMachine || "-" },
    { key: "qty", header: "Qty", renderCell: (row) => row.C_Qty || 0 },
    { key: "user", header: "User", renderCell: (row) => row.English_Name || "-" }
  ];

  useEffect(() => {
    if (session.loading) return;
    fetch("/api/reason-c-feed-in")
      .then((r) => r.json())
      .then((data) => setReasons(Array.isArray(data) ? data : []))
      .catch(() => setReasons([]));
  }, [session.loading]);

  useEffect(() => {
    if (!reasonC) {
      setGroups([]);
      setGroupMc("");
      return;
    }

    fetch("/api/group-machine-by-reason", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reasone_code: reasonC })
    })
      .then(async (r) => ({ ok: r.ok, data: await r.json() }))
      .then(({ ok, data }) => {
        if (!ok || !Array.isArray(data)) {
          setGroups([]);
          return;
        }
        setGroups(data);
        if (data.length === 1) {
          setGroupMc(String(data[0].sub_proces ?? ""));
        }
      })
      .catch(() => setGroups([]));
  }, [reasonC]);

  async function findWip() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/wip-confirmed-by-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: workDate, shift, machine: session.machine })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message ?? "Load failed");
      }
      setRows(data);
      setSelected(null);
      setSelectedKey(null);
      setDetails([]);
      setSelectedDetail(null);
      setAcOutput(null);
    } catch (error) {
      setRows([]);
      setMessage(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  async function onSelectRow(row: WipRow) {
    setSelected(row);
    setSelectedKey(rowKey(row));
    setSelectedDetail(null);

    const [detailRes, outputRes] = await Promise.all([
      fetch("/api/grade-c-confirmed-detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch: row.Batch, matcode: row.Matcode })
      }),
      fetch("/api/ac-output-by-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processorder: row.processorder, batch: row.BatchPL, machine: session.machine })
      })
    ]);

    const detailsData = await detailRes.json();
    const outputData = await outputRes.json();

    setDetails(Array.isArray(detailsData) ? detailsData : []);
    setAcOutput(Array.isArray(outputData) && outputData.length ? outputData[0] : null);
  }

  async function confirmGradeC() {
    if (!selected) {
      setMessage("Please select a WIP row");
      return;
    }
    if (!reasonC || !groupMc || !cqty) {
      setMessage("Please fill reason, group machine and quantity");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/confirm-grade-c-wip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: session.user,
          processorder: selected.processorder,
          batch: selected.Batch,
          matcode: selected.Matcode,
          cqty: Number(cqty),
          creason: reasonC,
          groupMc,
          machine: session.machine
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message ?? "Confirm failed");
      }
      setMessage(data.message ?? "Success");
      await findWip();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  async function deleteRow() {
    if (!selectedDetail) {
      setMessage("Please select detail row to delete");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/cancel-row-grade-c", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ID: selectedDetail.ID })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message ?? "Delete failed");
      }
      setMessage(data.message ?? "Deleted");
      await findWip();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  if (session.loading) return <PageLoader text="Loading data..." />;

  return (
    <main>
      <AppNav userName={session.name} />
      <div className="container">
        <h1 className="text-primary">Confirm Grade C WIP <span>{session.machine ? `(${session.machine})` : ""}</span></h1>

        <WorkFilterBar
          workDate={workDate}
          shift={shift}
          loading={loading}
          findLabel="Find WIP in Shift"
          onWorkDateChange={setWorkDate}
          onShiftChange={setShift}
          onFind={findWip}
        />

        <div className="table-wrap">
          <SelectableDataTable
            rows={rows}
            columns={wipColumns}
            getRowKey={rowKey}
            selectedKey={selectedKey}
            onSelectRow={onSelectRow}
            tbodyId="bodyWip"
            wrapperClassName=""
          />
          <div className="col-12">
            <label>Total WIP confirm: <span className="text-success">{totals.qty || "Waiting"}</span></label>
          </div>
          <div className="col-12">
            <label>Total WIP confirm C: <span className="text-success">{totals.cqty || "Waiting"}</span></label>
          </div>
        </div>

        <div className="row">
          <label>ProcessorderFG: <span className="text-success">{acOutput?.processorder ?? "Waiting"}</span></label>
          <label>MatcodeFG: <span className="text-success">{acOutput?.Matcode ?? "Waiting"}</span></label>
          <label>BatchFG: <span className="text-success">{acOutput?.Batch ?? "Waiting"}</span></label>
          <label>Grade A+C output: <span className="text-success">{acOutput?.totalOutput ?? "Waiting"}</span></label>
          <label>Quantity: <span className="text-success">{selected?.qty ?? "Waiting"}</span></label>
          <label>C Qty: <span className="text-success">{selected?.cqty ?? "Waiting"}</span></label>

          <GradeCActionForm
            reasonC={reasonC}
            groupMc={groupMc}
            cqty={cqty}
            reasons={reasons}
            groups={groups}
            loading={loading}
            onReasonChange={setReasonC}
            onGroupChange={setGroupMc}
            onCqtyChange={setCqty}
            onConfirm={confirmGradeC}
          />
        </div>

        <SelectableDataTable
          rows={details}
          columns={detailColumns}
          getRowKey={detailRowKey}
          selectedKey={selectedDetail ? detailRowKey(selectedDetail) : null}
          onSelectRow={(row) => setSelectedDetail(row)}
          tbodyId="bodyGradeCDetail"
        />
        <div className="col-12 col-xl-6 px-3 pb-3">
          <div className="d-flex align-items-center">
            <button type="button" className="btn btn-danger" onClick={deleteRow} disabled={loading}>Delete Row</button>
          </div>
        </div>

        {message && <div className="alert alert-danger mt-3">{message}</div>}
      </div>
    </main>
  );
}
