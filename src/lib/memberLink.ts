import { DEFAULT_MEMBERS, MEMBER_EMAIL_LINKS } from "@/config/household";

export function memberIdFromEmail(email?: string | null): string | null {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return null;
  const memberId = MEMBER_EMAIL_LINKS[normalized];
  if (!memberId) return null;
  return DEFAULT_MEMBERS.some((member) => member.id === memberId)
    ? memberId
    : null;
}

export function guessMemberId(input: {
  email?: string | null;
  displayName?: string | null;
}): string | null {
  const fromEmail = memberIdFromEmail(input.email);
  if (fromEmail) return fromEmail;

  const email = input.email?.toLowerCase() ?? "";
  const displayName = input.displayName?.toLowerCase() ?? "";
  const localPart = email.split("@")[0] ?? "";

  for (const member of DEFAULT_MEMBERS) {
    const name = member.name.toLowerCase();
    if (
      displayName.includes(name) ||
      localPart.includes(name) ||
      email.includes(name)
    ) {
      return member.id;
    }
  }

  return null;
}

export function memberNameById(memberId: string): string | undefined {
  return DEFAULT_MEMBERS.find((member) => member.id === memberId)?.name;
}
