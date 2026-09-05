import { AppGate } from "./components/AppGate";

const memberViews = ["Home", "Claims", "Passbook", "ServiceHistory", "Account", "Finance"];

export default async function Home({ searchParams }: { searchParams: Promise<{ view?: string | string[]; tab?: string | string[]; claim?: string | string[]; member?: string | string[]; section?: string | string[] }> }) {
  const { view, tab, claim, member, section } = await searchParams;
  const initialNav = typeof view === "string" && memberViews.includes(view) ? view : "Home";
  const initialClaimsTab = tab === "start" ? "start" : "status";
  const initialClaimId = typeof claim === "string" ? claim : undefined;
  const initialMemberId = typeof member === "string" ? member : undefined;
  return <AppGate initialNav={initialNav} initialClaimsTab={initialClaimsTab} initialClaimId={initialClaimId} initialMemberId={initialMemberId} initialProfileSection={typeof section === "string" ? section : undefined} />;
}
