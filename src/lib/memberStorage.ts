const MEMBER_ID_KEY = "homeharmony-linked-member-id";

export function readStoredMemberId(): string | null {
  try {
    return localStorage.getItem(MEMBER_ID_KEY);
  } catch {
    return null;
  }
}

export function writeStoredMemberId(memberId: string) {
  try {
    localStorage.setItem(MEMBER_ID_KEY, memberId);
  } catch {
    // ignore quota / private mode
  }
}

export function clearStoredMemberId() {
  try {
    localStorage.removeItem(MEMBER_ID_KEY);
  } catch {
    // ignore
  }
}
