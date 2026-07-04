// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SignInPanel } from "@/components/auth/sign-in-panel";

vi.mock("next-auth/react", () => ({
  signIn: vi.fn()
}));

const routerPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPush
  })
}));

beforeEach(() => {
  window.localStorage.clear();
  routerPush.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("SignInPanel", () => {
  it("renders email, Google, and WeChat sign-in controls", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            providers: { email: false, google: false, wechat: false },
            errors: {
              email: "Email login requires RESEND_API_KEY, EMAIL_FROM, and DATABASE_URL.",
              google: "Google login requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
              wechat: "WeChat login requires WECHAT_CLIENT_ID and WECHAT_CLIENT_SECRET."
            }
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    render(<SignInPanel />);

    expect(screen.getByRole("heading", { name: "Sign in" })).toBeTruthy();
    expect(screen.getByPlaceholderText("you@example.com")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue Locally" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue with WeChat" })).toBeTruthy();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/auth-provider-status");
    });
  });

  it("continues to chat with any valid email during local development", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ providers: {}, errors: {} }), { status: 200 })));

    render(<SignInPanel />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/auth-provider-status");
    });

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "local@example.com" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue Locally" }));

    expect(JSON.parse(window.localStorage.getItem("aurum.localUser.v1") ?? "{}")).toMatchObject({
      email: "local@example.com"
    });
    expect(routerPush).toHaveBeenCalledWith("/chat");
  });
});
