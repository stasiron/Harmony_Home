const MEMBER_ID_KEY = "homeharmony-linked-member-id";
const SEE_AS_MEMBER_ID_KEY = "homeharmony-see-as-member-id";

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

export function readSeeAsMemberId(): string | null {
  try {
    return sessionStorage.getItem(SEE_AS_MEMBER_ID_KEY);
  } catch {
    return null;
  }
}

export function writeSeeAsMemberId(memberId: string) {
  try {
    sessionStorage.setItem(SEE_AS_MEMBER_ID_KEY, memberId);
  } catch {
    // ignore quota / private mode
  }
}

export function clearSeeAsMemberId() {
  try {
    sessionStorage.removeItem(SEE_AS_MEMBER_ID_KEY);
  } catch {
    // ignore
  }
}
