"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const MACHINES = ["PL1", "PL3", "PL4", "PL5"];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [machine, setMachine] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, department: machine })
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message ?? "Login failed");
        return;
      }

      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("machine", machine);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow-lg" style={{ width: "100%", maxWidth: 400 }}>
        <h3 className="text-center mb-4">Login</h3>
        <img className="img-fluid mb-3" src="/assets/thumbnail_image001.png" alt="Logo" />

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="username" className="form-label">Username</label>
            <input id="username" type="text" className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input id="password" type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div className="mb-3">
            <label className="form-label">Department</label>
            <select className="form-select" value={machine} onChange={(e) => setMachine(e.target.value)} required>
              <option value="">Select</option>
              {MACHINES.map((mc) => <option key={mc} value={mc}>{mc}</option>)}
            </select>
          </div>

          <button id="logInBtn" className="btn btn-primary w-100" disabled={loading} type="submit">
            {loading ? "Loading..." : "Login"}
          </button>
        </form>

        {error && <div className="mt-3 text-danger">{error}</div>}
      </div>
    </div>
  );
}
