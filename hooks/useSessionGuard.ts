"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SessionState = {
  token: string;
  machine: string;
  user: string;
  name: string;
  loading: boolean;
};

export function useSessionGuard(): SessionState {
  const router = useRouter();
  const [state, setState] = useState<SessionState>({
    token: "",
    machine: "",
    user: "",
    name: "",
    loading: true
  });

  useEffect(() => {
    const token = sessionStorage.getItem("token") ?? "";
    const machine = sessionStorage.getItem("machine") ?? "";

    if (!token || !machine) {
      router.push("/login");
      return;
    }

    fetch("/api/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ function: "getUser" })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !Array.isArray(data) || !data.length) {
          throw new Error("Unauthorized");
        }

        const user = String(data[0].user_ID ?? "");
        const name = String(data[0].name_user ?? "");

        sessionStorage.setItem("user", user);
        sessionStorage.setItem("Name_Surname", name);

        setState({ token, machine, user, name, loading: false });
      })
      .catch(() => {
        sessionStorage.clear();
        router.push("/login");
      });
  }, [router]);

  return state;
}
