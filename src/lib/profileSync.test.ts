import { describe, expect, it } from "vitest";
import { isProfileFresh, PROFILE_REFRESH_MS } from "@/lib/profileSync";

const profile = {
  uid: "u1",
  email: "a@b.c",
  displayName: "Ala",
  photoURL: null,
};
const at = (ms: number) => ({ toMillis: () => ms });

describe("isProfileFresh", () => {
  it("brak dokumentu — zapisz", () => {
    expect(isProfileFresh(undefined, profile, 1000)).toBe(false);
  });

  it("te same dane i świeży lastLoginAt — bez zapisu", () => {
    expect(
      isProfileFresh({ ...profile, lastLoginAt: at(1000) }, profile, 2000),
    ).toBe(true);
  });

  it("zmienione dane — zapisz", () => {
    expect(
      isProfileFresh(
        { ...profile, displayName: "Stara", lastLoginAt: at(1000) },
        profile,
        2000,
      ),
    ).toBe(false);
  });

  it("nowy memberId — zapisz", () => {
    expect(
      isProfileFresh(
        { ...profile, lastLoginAt: at(1000) },
        { ...profile, memberId: "stas" },
        2000,
      ),
    ).toBe(false);
  });

  it("stary lastLoginAt — zapisz", () => {
    expect(
      isProfileFresh(
        { ...profile, lastLoginAt: at(0) },
        profile,
        PROFILE_REFRESH_MS + 1,
      ),
    ).toBe(false);
  });
});
