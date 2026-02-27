"use client";

import { KeyboardEvent, useMemo, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { useSessionGuard } from "@/hooks/useSessionGuard";

type QrRow = {
  QR: string;
  Batch: string;
  Matcode: string;
  Reci_qty: string;
  statusout?: string;
  processorder?: string;
};

export default function HomePage() {
  const session = useSessionGuard();
  const [processorder, setProcessorder] = useState("");
  const [qrInput, setQrInput] = useState("");
  const [qrs, setQrs] = useState<QrRow[]>([]);
  const [rawmatWip, setRawmatWip] = useState<string[]>([]);
  const [rawmatLoadedFor, setRawmatLoadedFor] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const totalQty = useMemo(() => qrs.reduce((sum, row) => sum + Number(row.Reci_qty || 0), 0), [qrs]);

  async function ensureRawmat() {
    if (rawmatLoadedFor === processorder && rawmatWip.length > 0) return rawmatWip;

    const response = await fetch("/api/rawmat-cor3", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ processorder, machine: session.machine })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message ?? "Failed to check COR3");

    setRawmatWip(data.rawmatWip);
    setRawmatLoadedFor(processorder);
    return data.rawmatWip as string[];
  }

  async function scanQr() {
    if (!processorder) {
      setMessage("Please enter processorder");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const latestRawmat = await ensureRawmat();

      const response = await fetch("/api/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr: qrInput, machine: session.machine })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "QR lookup failed");

      const row: QrRow = data[0];
      if (!latestRawmat.includes(row.Matcode)) {
        throw new Error("Rawmat WIP of this QR is not in COR3 of this processorder");
      }

      setQrs((prev) => (prev.some((item) => item.QR === row.QR) ? prev : [...prev, row]));
      setQrInput("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  function onQrKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      scanQr();
    }
  }

  async function confirmQrs() {
    if (!qrs.length) {
      setMessage("Please scan at least one QR");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/confirm-qrs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrs, user: session.user, processorder, machine: session.machine })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Confirm failed");

      setMessage(data.message ?? "Success");
      setQrs([]);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  if (session.loading) return <main className="container py-4">Loading...</main>;

  return (
    <>
      <AppNav userName={session.name} />
      <div className="container">
        <h1 className="text-primary">Confirm wip <span>{session.machine ? `(${session.machine})` : ""}</span></h1>

        <label className="mb-3 text-secondary" htmlFor="processorderWorking">{"\u0e23\u0e30\u0e1a\u0e38 Processorder \u0e07\u0e32\u0e19\u0e17\u0e35\u0e48\u0e40\u0e14\u0e34\u0e19"}</label>
        <input
          id="processorderWorking"
          className="form-control mb-3"
          value={processorder}
          onChange={(e) => {
            setProcessorder(e.target.value);
            setRawmatLoadedFor("");
            setRawmatWip([]);
            setQrs([]);
            setMessage("");
          }}
        />

        <label className="mb-3 text-secondary" htmlFor="qrInput">{"Scan QR-code \u0e17\u0e35\u0e48\u0e43\u0e0a\u0e49\u0e40\u0e14\u0e34\u0e19\u0e40\u0e04\u0e23\u0e37\u0e48\u0e2d\u0e07"}</label>
        <input
          id="qrInput"
          className="form-control mb-3"
          value={qrInput}
          onChange={(e) => setQrInput(e.target.value)}
          onKeyDown={onQrKeyDown}
          placeholder={"\u0e41\u0e15\u0e30\u0e15\u0e23\u0e07\u0e19\u0e35\u0e49\u0e01\u0e48\u0e2d\u0e19 Scan"}
          autoFocus
        />

        <div className="d-flex gap-2 mb-3">
          <button className="btn btn-warning ms-auto" disabled={loading} onClick={scanQr} type="button">Find</button>
          <button className="btn btn-success" disabled={loading || qrs.length === 0} onClick={confirmQrs} type="button">Confirm WIP to Processorder</button>
        </div>

        <div className="row mb-3">
          <label>QR Number: <span className="text-success">{qrs[qrs.length - 1]?.QR ?? "Waiting"}</span></label>
          <label>Matcode: <span className="text-success">{qrs[qrs.length - 1]?.Matcode ?? "Waiting"}</span></label>
          <label>Batch: <span className="text-success">{qrs[qrs.length - 1]?.Batch ?? "Waiting"}</span></label>
          <label>Quantity: <span className="text-success">{qrs[qrs.length - 1]?.Reci_qty ?? "Waiting"}</span></label>
          <div className="col-6">
            <label>Total: <span className="text-success">{totalQty || "Waiting"}</span></label>
          </div>
          <div className="col-6">
            <label>Total Pallet: <span className="text-success">{qrs.length || "Waiting"}</span></label>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table border border-1">
            <thead>
              <tr>
                <th>Qr number</th>
                <th>Matcode</th>
                <th>Batch</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {qrs.map((row) => (
                <tr key={row.QR}>
                  <td>{row.QR}</td>
                  <td>{row.Matcode}</td>
                  <td>{row.Batch}</td>
                  <td>{row.Reci_qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {message && <div className="alert alert-danger mt-3" role="alert">{message}</div>}
      </div>
    </>
  );
}
