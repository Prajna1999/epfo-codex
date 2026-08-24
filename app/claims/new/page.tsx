import type { Metadata } from "next";
import { ClaimFlow } from "./ClaimFlow";

export const metadata: Metadata = { title: "Submit a claim | EPFO Member Portal" };

export default function NewClaimPage() {
  return <ClaimFlow />;
}
