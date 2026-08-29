import { readBrowserStore, writeBrowserStore } from "./browser-store";
import type { MockRole } from "./mock-login-data";

const AUTH_KEY = "epfo.auth-role";

export function readAuthRole(): MockRole | null {
  return readBrowserStore<MockRole | null>(AUTH_KEY, null);
}

export function writeAuthRole(role: MockRole | null) {
  writeBrowserStore(AUTH_KEY, role);
}
