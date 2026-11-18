import { describe, expect, it } from "vitest";
import { cleanEmailLinkUrl } from "@/lib/inviteLink";

describe("cleanEmailLinkUrl", () => {
  it("usuwa kody logowania z linku z maila", () => {
    expect(
      cleanEmailLinkUrl(
        "https://app.example/?emailLink=1&apiKey=k&oobCode=abc&mode=signIn",
      ),
    ).toBe("/");
  });

  it("zostawia kod zaproszenia", () => {
    expect(
      cleanEmailLinkUrl(
        "https://app.example/?emailLink=1&join=K7M2QX9P&oobCode=abc&mode=signIn",
      ),
    ).toBe("/?join=K7M2QX9P");
  });
});
