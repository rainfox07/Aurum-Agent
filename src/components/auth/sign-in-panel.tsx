"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { saveLocalUserSession } from "@/lib/client-store";

type ProviderStatusResponse = {
  providers: {
    email: boolean;
    google: boolean;
    wechat: boolean;
  };
  errors: {
    email: string | null;
    google: string | null;
    wechat: string | null;
  };
};

const fallbackStatus: ProviderStatusResponse = {
  providers: {
    email: false,
    google: false,
    wechat: false
  },
  errors: {
    email: "Email login requires RESEND_API_KEY and EMAIL_FROM.",
    google: "Google login requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
    wechat: "WeChat login requires WECHAT_CLIENT_ID and WECHAT_CLIENT_SECRET."
  }
};

const useLocalEmailBypass = process.env.NODE_ENV !== "production";

export function SignInPanel() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<ProviderStatusResponse>(fallbackStatus);
  const [loading, setLoading] = useState<"email" | "google" | "wechat" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/auth-provider-status")
      .then((response) => (response.ok ? response.json() : fallbackStatus))
      .then((data: ProviderStatusResponse) => {
        if (active) {
          setStatus(data);
        }
      })
      .catch(() => {
        if (active) {
          setStatus(fallbackStatus);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (useLocalEmailBypass) {
      setLoading("email");
      saveLocalUserSession(email.trim());
      setMessage("本地调试登录已通过，正在进入 Aurum。");
      router.push("/chat");
      return;
    }

    if (!status.providers.email) {
      setError(status.errors.email ?? fallbackStatus.errors.email);
      return;
    }

    setLoading("email");
    const result = await signIn("resend", {
      email: email.trim(),
      redirect: false,
      redirectTo: "/chat"
    });
    setLoading(null);

    if (result?.error) {
      setError(result.error);
      return;
    }

    setMessage("请检查邮箱，点击验证链接完成登录。");
  }

  async function startOAuth(provider: "google" | "wechat") {
    setError(null);
    setMessage(null);

    if (!status.providers[provider]) {
      setError(status.errors[provider] ?? fallbackStatus.errors[provider]);
      return;
    }

    setLoading(provider);
    await signIn(provider, {
      redirectTo: "/chat"
    });
  }

  return (
    <section className="auth-card" aria-label="Sign in">
      <div style={{ display: "grid", gap: 8 }}>
        <div className="brand-title" style={{ fontSize: 30, lineHeight: "38px", fontWeight: 700 }}>
          Aurum
        </div>
        <h1 className="headline">Sign in</h1>
        <p className="muted label" style={{ margin: 0 }}>
          Use email verification or OAuth to continue.
        </p>
      </div>

      <form onSubmit={submitEmail} style={{ display: "grid", gap: 14 }}>
        <label className="settings-field">
          <span>Email</span>
          <input
            className="underline-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>
        <Button variant="primary" disabled={loading !== null}>
          <Mail size={16} aria-hidden="true" />
          {loading === "email" ? (useLocalEmailBypass ? "Entering..." : "Sending...") : useLocalEmailBypass ? "Continue Locally" : "Send Verification Link"}
        </Button>
      </form>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <Button type="button" onClick={() => startOAuth("google")} disabled={loading !== null || !status.providers.google}>
          <ShieldCheck size={16} aria-hidden="true" />
          {loading === "google" ? "Opening Google..." : "Continue with Google"}
        </Button>
        <Button type="button" onClick={() => startOAuth("wechat")} disabled={loading !== null || !status.providers.wechat}>
          <MessageCircle size={16} aria-hidden="true" />
          {loading === "wechat" ? "Opening WeChat..." : "Continue with WeChat"}
        </Button>
      </div>

      {message ? (
        <div className="auth-state success" role="status">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="auth-state error" role="alert">
          {error}
        </div>
      ) : null}

      <p className="meta" style={{ margin: 0 }}>
        WeChat setup: docs/auth/wechat-login.md
      </p>
    </section>
  );
}
