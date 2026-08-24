import { Portal } from "./components/Portal";

const memberViews = ["Home", "Money", "Employment", "Withdraw", "Account"];

export default async function Home({ searchParams }: { searchParams: Promise<{ view?: string | string[] }> }) {
  const view = (await searchParams).view;
  return <Portal initialNav={typeof view === "string" && memberViews.includes(view) ? view : "Home"} />;
}
