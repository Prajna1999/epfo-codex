import { Portal } from "./components/Portal";

const memberViews = ["Home", "Claims", "Passbook", "Employment", "Account"];

export default async function Home({ searchParams }: { searchParams: Promise<{ view?: string | string[]; tab?: string | string[]; claim?: string | string[] }> }) {
  const { view, tab, claim } = await searchParams;
  const initialNav = typeof view === "string" && memberViews.includes(view) ? view : "Home";
  const initialClaimsTab = tab === "start" ? "start" : "status";
  const initialClaimId = typeof claim === "string" ? claim : undefined;
  return <Portal key={`${initialNav}:${initialClaimsTab}:${initialClaimId ?? ""}`} initialNav={initialNav} initialClaimsTab={initialClaimsTab} initialClaimId={initialClaimId} />;
}
