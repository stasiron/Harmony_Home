import { generateKeyPairSync, sign } from "node:crypto";
import { describe, expect, it } from "vitest";
import { viewerFromPayload } from "@/lib/firebaseToken.server";

const PROJECT = "demo-project";
const NOW = 1_800_000_000;

const valid = {
  aud: PROJECT,
  iss: `https://securetoken.google.com/${PROJECT}`,
  sub: "uid-1",
  iat: NOW - 60,
  exp: NOW + 3000,
  email: "Ala@Example.com",
  email_verified: true,
  firebase: { sign_in_provider: "google.com" },
};

describe("viewerFromPayload", () => {
  it("poprawny token → viewer z e-mailem małymi literami", () => {
    expect(viewerFromPayload(valid, PROJECT, NOW)).toEqual({
      uid: "uid-1",
      email: "ala@example.com",
      emailVerified: true,
      anonymous: false,
    });
  });

  it("inny projekt, wydawca albo wygasły — odrzucony", () => {
    expect(viewerFromPayload({ ...valid, aud: "other" }, PROJECT, NOW)).toBe(
      null,
    );
    expect(
      viewerFromPayload({ ...valid, iss: "https://evil" }, PROJECT, NOW),
    ).toBe(null);
    expect(viewerFromPayload({ ...valid, exp: NOW - 1 }, PROJECT, NOW)).toBe(
      null,
    );
  });

  it("anonimowy rozpoznany", () => {
    expect(
      viewerFromPayload(
        { ...valid, firebase: { sign_in_provider: "anonymous" } },
        PROJECT,
        NOW,
      )?.anonymous,
    ).toBe(true);
  });

  it("node:crypto weryfikuje RS256 tak jak w verifyFirebaseIdToken", async () => {
    // Sanity check formatu: podpis base64url nad `header.payload`
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
    });
    const data = Buffer.from("aGVhZGVy.cGF5bG9hZA");
    const signature = sign("RSA-SHA256", data, privateKey).toString(
      "base64url",
    );
    const { verify } = await import("node:crypto");
    expect(
      verify(
        "RSA-SHA256",
        data,
        publicKey,
        Buffer.from(signature, "base64url"),
      ),
    ).toBe(true);
  });
});
