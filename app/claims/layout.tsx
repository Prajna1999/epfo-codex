import type { ReactNode } from "react";
import { MemberPortalShell } from "../components/PortalChrome";

export default function ClaimsLayout({ children }: { children: ReactNode }) {
  return <MemberPortalShell>{children}</MemberPortalShell>;
}
