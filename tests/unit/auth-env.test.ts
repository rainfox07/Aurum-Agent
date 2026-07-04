import { describe, expect, it } from "vitest";
import { buildAuthProviders, getAuthProviderAvailability } from "@/lib/auth/providers";
import { getAuthConfigurationError, getAuthSecret, type ServerEnv } from "@/lib/env";

const placeholderEnv: ServerEnv = {
  AUTH_SECRET: "replace-with-32-plus-character-secret",
  RESEND_API_KEY: "re_xxx",
  EMAIL_FROM: "Aurum Agent <login@example.com>",
  GOOGLE_CLIENT_ID: "google-client-id",
  GOOGLE_CLIENT_SECRET: "google-client-secret",
  WECHAT_CLIENT_ID: "",
  WECHAT_CLIENT_SECRET: ""
};

describe("auth environment helpers", () => {
  it("does not enable providers for placeholder credentials", () => {
    expect(getAuthProviderAvailability(placeholderEnv)).toEqual({
      email: false,
      google: false,
      wechat: false
    });
    expect(buildAuthProviders(placeholderEnv)).toEqual([]);
  });

  it("returns clear provider configuration errors", () => {
    expect(getAuthConfigurationError("email", placeholderEnv)).toBe("Email login requires RESEND_API_KEY, EMAIL_FROM, and DATABASE_URL.");
    expect(getAuthConfigurationError("google", placeholderEnv)).toBe(
      "Google login requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
    );
  });

  it("enables email provider only when Resend and database settings are real", () => {
    const configuredEnv: ServerEnv = {
      ...placeholderEnv,
      DATABASE_URL: "postgres://aurum:secret@localhost:5432/aurum",
      RESEND_API_KEY: "re_real_local_test_key",
      EMAIL_FROM: "Aurum Agent <login@aurum.example>"
    };

    expect(getAuthProviderAvailability(configuredEnv).email).toBe(true);
    expect(buildAuthProviders(configuredEnv)).toHaveLength(1);
  });

  it("uses a local fallback auth secret when env is placeholder-only", () => {
    expect(getAuthSecret(placeholderEnv).length).toBeGreaterThanOrEqual(32);
  });
});
