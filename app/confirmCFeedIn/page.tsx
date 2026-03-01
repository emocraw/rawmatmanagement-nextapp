"use client";

import { useEffect, useMemo, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { PageLoader } from "@/components/PageLoader";
import { useSessionGuard } from "@/hooks/useSessionGuard";

type WipRow = { Batch: string; Matcode: string; qty: number; cqty: number; processorder: string; BatchPL: string };
type GradeCDetail = { ID: number; Material: string; Batch: string; Reason_Name: string; GroupMachine: string; C_Qty: number; English_Name: string };

export default function ConfirmCFeedInPage() {
  const session = useSessionGuard();
  const [workDate, setWorkDate] = useState("");
  const [shift, setShift] = useState("night");
  const [rows, setRows] = useState<WipRow[]>([]);
  const [selected, setSelected] = useState<WipRow | null>(null);
  const [details, setDetails] = useState<GradeCDetail[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<GradeCDetail | null>(null);
  const [reasons, setReasons] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
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

        <div className="row">
          <div className="col-6">
            <label className="mb-3 text-secondary">Work Date</label>
            <input className="form-control mb-3" type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} />
          </div>
          <div className="col-6">
            <label className="mb-3 text-secondary">Shift</label>
            <select className="form-control" value={shift} onChange={(e) => setShift(e.target.value)}>
              <option value="night">Night</option>
              <option value="day">Day</option>
            </select>
          </div>
        </div>
        <div className="d-flex">
          <button type="button" className="btn btn-warning ms-auto mb-3" onClick={findWip} disabled={loading}>Find WIP in Shift</button>
        </div>

        <div className="table-wrap">
          <table className="table border border-1">
            <thead>
              <tr>
                <th>Batch</th>
                <th>Matcode</th>
                <th>Quantity</th>
                <th>C Qty</th>
                <th>Work order</th>
                <th>Work batch</th>
              </tr>
            </thead>
            <tbody id="bodyWip">
              {rows.map((row) => (
                <tr
                  key={`${row.Batch}-${row.Matcode}-${row.processorder}`}
                  className={selected?.Batch === row.Batch && selected?.Matcode === row.Matcode ? "selected-row" : ""}
                  style={{ cursor: "pointer" }}
                  onClick={() => onSelectRow(row)}
                >
                  <td>{row.Batch}</td>
                  <td>{row.Matcode}</td>
                  <td>{row.qty}</td>
                  <td>{row.cqty || 0}</td>
                  <td>{row.processorder}</td>
                  <td>{row.BatchPL}</td>
                </tr>
              ))}
            </tbody>
          </table>
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

          <div className="col-12">
            <div className="d-flex">
              <select className="form-control" style={{ width: 200 }} value={reasonC} onChange={(e) => setReasonC(e.target.value)}>
                <option value="">Select reason Grade C</option>
                {reasons.map((r: any) => <option key={r.Reason_Code} value={r.Reason_Code}>{r.Reason_Name}</option>)}
              </select>
              <select className="form-control ms-3" style={{ width: 200 }} value={groupMc} onChange={(e) => setGroupMc(e.target.value)}>
                <option value="">Select Group Machine</option>
                {groups.map((g: any) => <option key={g.id} value={g.sub_proces}>{g.sub_proces}</option>)}
              </select>
              <input id="cqty" className="ms-3" type="number" value={cqty} onChange={(e) => setCqty(e.target.value)} />
              <label className="form-label">pcs</label>
            </div>
          </div>
          <div className="col-12 col-xl-6 px-3 pb-3">
            <div className="d-flex align-items-center">
              <button type="button" className="btn btn-success" onClick={confirmGradeC} disabled={loading}>Confirm Grade C</button>
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table border border-1">
            <thead>
              <tr>
                <th>Matcode</th>
                <th>Batch</th>
                <th>Reason_Code</th>
                <th>Group Machine</th>
                <th>Qty</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody id="bodyGradeCDetail">
              {details.map((row) => (
                <tr
                  key={row.ID}
                  onClick={() => setSelectedDetail(row)}
                  className={selectedDetail?.ID === row.ID ? "selected-row" : ""}
                  style={{ cursor: "pointer" }}
                >
                  <td>{row.Material}</td>
                  <td>{row.Batch}</td>
                  <td>{row.Reason_Name}</td>
                  <td>{row.GroupMachine || "-"}</td>
                  <td>{row.C_Qty || 0}</td>
                  <td>{row.English_Name || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
