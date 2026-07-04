import { describe, expect, it } from "vitest";
import { userSettingsInputSchema } from "@/lib/settings/user-settings";

describe("userSettingsInputSchema", () => {
  it("accepts basic personalization settings", () => {
    expect(
      userSettingsInputSchema.parse({
        displayName: "Rain",
        aiCallsUser: "Rain",
        aiTone: "direct and concise"
      })
    ).toEqual({
      displayName: "Rain",
      aiCallsUser: "Rain",
      aiTone: "direct and concise"
    });
  });

  it("rejects overly long tone instructions", () => {
    expect(() =>
      userSettingsInputSchema.parse({
        aiTone: "x".repeat(241)
      })
    ).toThrow();
  });
});
