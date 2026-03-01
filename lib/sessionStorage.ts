"use client";

const APP_NS = "cinfirmrawmatandc";

const KEYS = {
  token: `${APP_NS}.token`,
  machine: `${APP_NS}.machine`,
  user: `${APP_NS}.user`,
  name: `${APP_NS}.name`
} as const;

const LEGACY_KEYS = ["token", "machine", "user", "Name_Surname"] as const;

export function getSessionAuth() {
  return {
    token: sessionStorage.getItem(KEYS.token) ?? "",
    machine: sessionStorage.getItem(KEYS.machine) ?? ""
  };
}

export function setSessionAuth(token: string, machine: string) {
  sessionStorage.setItem(KEYS.token, token);
  sessionStorage.setItem(KEYS.machine, machine);
}

export function setSessionProfile(user: string, name: string) {
  sessionStorage.setItem(KEYS.user, user);
  sessionStorage.setItem(KEYS.name, name);
}

export function clearAppSession() {
  Object.values(KEYS).forEach((key) => sessionStorage.removeItem(key));
  LEGACY_KEYS.forEach((key) => sessionStorage.removeItem(key));
}
