"use client";

import { useEffect, useMemo, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { useSessionGuard } from "@/hooks/useSessionGuard";

type FgRow = { mcname: string; processorder: string; Matcode: string; matdes: string; Batch: string; totalOutput: number; slocs: string; cqty: number };
type GradeCDetail = { ID: number; Material: string; Batch: string; Reason_Name: string; GroupMachine: string; C_Qty: number; English_Name: string };

export default function ConfirmCFeedOutPage() {
  const session = useSessionGuard();
  const [workDate, setWorkDate] = useState("");
  const [shift, setShift] = useState("night");
  const [rows, setRows] = useState<FgRow[]>([]);
  const [selected, setSelected] = useState<FgRow | null>(null);
  const [details, setDetails] = useState<GradeCDetail[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<GradeCDetail | null>(null);
  const [reasons, setReasons] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [reasonC, setReasonC] = useState("");
  const [groupMc, setGroupMc] = useState("");
  const [cqty, setCqty] = useState("");
  const [batchRawmatOptions, setBatchRawmatOptions] = useState<string[]>([]);
  const [batchRawmat, setBatchRawmat] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const totals = useMemo(
    () => rows.reduce((acc, row) => ({ qty: acc.qty + Number(row.totalOutput || 0), cqty: acc.cqty + Number(row.cqty || 0) }), { qty: 0, cqty: 0 }),
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

  async function findFg() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/fg-by-date", {
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
      setBatchRawmatOptions([]);
      setBatchRawmat("");
    } catch (error) {
      setRows([]);
      setMessage(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  async function onSelectRow(row: FgRow) {
    setSelected(row);
    setSelectedDetail(null);
    setBatchRawmat("");

    const [detailRes, rawmatRes] = await Promise.all([
      fetch("/api/grade-c-confirmed-detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch: row.Batch, matcode: row.Matcode })
      }),
      fetch("/api/rawmat-batch-by-processorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processorder: row.processorder, machine: session.machine })
      })
    ]);

    const detailsData = await detailRes.json();
    const rawmatData = await rawmatRes.json();

    setDetails(Array.isArray(detailsData) ? detailsData : []);
    setBatchRawmatOptions(Array.isArray(rawmatData) ? rawmatData.map((i: any) => String(i.Batch)) : []);
  }

  async function confirmGradeC() {
    if (!selected) {
      setMessage("Please select an FG row");
      return;
    }
    if (!reasonC || !groupMc || !cqty) {
      setMessage("Please fill reason, group machine and quantity");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/confirm-grade-c-fg", {
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
          batchRawmat,
          machine: session.machine
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message ?? "Confirm failed");
      }
      setMessage(data.message ?? "Success");
      await findFg();
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
      const response = await fetch("/api/cancel-row-grade-c-fg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ID: selectedDetail.ID })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message ?? "Delete failed");
      }
      setMessage(data.message ?? "Deleted");
      await findFg();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  if (session.loading) return <main className="container py-4">Loading...</main>;

  return (
    <main>
      <AppNav userName={session.name} />
      <div className="container">
        <h1 className="text-primary">Confirm Grade C Feed Out <span>{session.machine ? `(${session.machine})` : ""}</span></h1>

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
          <button type="button" className="btn btn-warning ms-auto mb-3" onClick={findFg} disabled={loading}>Find FG in Shift</button>
        </div>

        <div className="table-wrap">
          <table className="table border border-1">
            <thead>
              <tr>
                <th>Machine</th>
                <th>Processorder</th>
                <th>Matcode</th>
                <th>Matdesc</th>
                <th>Batch</th>
                <th>Total Output</th>
                <th>SLoc</th>
                <th>C Qty</th>
              </tr>
            </thead>
            <tbody id="bodyFg">
              {rows.map((row) => (
                <tr
                  key={`${row.Batch}-${row.Matcode}-${row.processorder}`}
                  className={selected?.Batch === row.Batch && selected?.Matcode === row.Matcode ? "selected-row" : ""}
                  style={{ cursor: "pointer" }}
                  onClick={() => onSelectRow(row)}
                >
                  <td>{row.mcname}</td>
                  <td>{row.processorder}</td>
                  <td>{row.Matcode}</td>
                  <td>{row.matdes}</td>
                  <td>{row.Batch}</td>
                  <td>{row.totalOutput}</td>
                  <td>{row.slocs}</td>
                  <td>{row.cqty || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="col-12">
            <label>Total FG Confirm: <span className="text-success">{totals.qty || "Waiting"}</span></label>
          </div>
          <div className="col-12">
            <label>Total FG Confirm C: <span className="text-success">{totals.cqty || "Waiting"}</span></label>
          </div>
        </div>

        <div className="row">
          <label>ProcessorderFG: <span className="text-success">{selected?.processorder ?? "Waiting"}</span></label>
          <label>MatcodeFG: <span className="text-success">{selected?.Matcode ?? "Waiting"}</span></label>
          <label>BatchFG: <span className="text-success">{selected?.Batch ?? "Waiting"}</span></label>
          <label>C Qty: <span className="text-success">{selected?.cqty ?? "Waiting"}</span></label>

          <div className="col-12">
            <div className="d-flex">
              <select className="form-control" style={{ width: 300 }} value={reasonC} onChange={(e) => setReasonC(e.target.value)}>
                <option value="">Select reason Grade C</option>
                {reasons.map((r: any) => <option key={r.Reason_Code} value={r.Reason_Code}>{r.Reason_Name}</option>)}
              </select>
              <select className="form-control ms-3" style={{ width: 300 }} value={groupMc} onChange={(e) => setGroupMc(e.target.value)}>
                <option value="">Select Group Machine</option>
                {groups.map((g: any) => <option key={g.id} value={g.sub_proces}>{g.sub_proces}</option>)}
              </select>
              <input id="cqty" className="ms-3" type="number" value={cqty} onChange={(e) => setCqty(e.target.value)} />
              <label className="form-label">pcs</label>
              <div className="ms-3">
                <select className="form-control" style={{ width: 220 }} value={batchRawmat} onChange={(e) => setBatchRawmat(e.target.value)}>
                  <option value="">Select Batch Rawmat</option>
                  {batchRawmatOptions.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
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
