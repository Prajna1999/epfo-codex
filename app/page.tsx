import ProfileChooser from "./profile-chooser";

const profiles = [
  { id: "member", kind: "Member", name: "My PF", identifier: "UAN · XXXX 1234", description: "View your balance, employment, claims, and nominations.", action: "Open my PF services" },
  { id: "employer", kind: "Establishment", name: "ABC Pvt Ltd", identifier: "Establishment · ORBBS0012345000", role: "CA · All extensions", description: "Manage employees, contributions, payments, and reports.", action: "Open establishment services" },
  { id: "principal-employer", kind: "Principal Employer", name: "Ministry Department", identifier: "PAN · AABCM1234K", role: "Government organization", description: "Monitor contractor compliance, workers, and remittances.", action: "Open contractor compliance" },
] as const;

export default function Home() {
  return <ProfileChooser profiles={profiles} />;
}
