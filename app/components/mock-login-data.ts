export type MockRole = "member" | "establishment" | "principal";

export const mockRoles = {
  member: { label: "Member", description: "Use your UAN to manage your PF account.", identifier: "UAN", loginId: "1009 2000 0123" },
  establishment: { label: "Establishment", description: "For authorised establishment representatives.", identifier: "Establishment ID (PF Code)", loginId: "MHBAN1234567000" },
  principal: { label: "Principal employer", description: "Track contractor and contract-worker compliance.", identifier: "PF Code / registered ID", loginId: "MHBAN1234567000" },
} satisfies Record<MockRole, { label: string; description: string; identifier: string; loginId: string }>;

export const mockPassword = "EPFO@123";

export const isMockOtp = (value: string) => value === "123456";
