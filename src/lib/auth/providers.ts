import type { Provider } from "next-auth/providers";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import WeChat from "next-auth/providers/wechat";
import { getAuthProviderStatus, getServerEnv, type AuthProviderStatus, type ServerEnv } from "@/lib/env";

export function buildAuthProviders(env: ServerEnv = getServerEnv()): Provider[] {
  const status = getAuthProviderStatus(env);
  const providers: Provider[] = [];

  if (status.email) {
    providers.push(
      Resend({
        apiKey: env.RESEND_API_KEY,
        from: env.EMAIL_FROM
      })
    );
  }

  if (status.google) {
    providers.push(
      Google({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET
      })
    );
  }

  if (status.wechat) {
    providers.push(
      WeChat({
        clientId: env.WECHAT_CLIENT_ID,
        clientSecret: env.WECHAT_CLIENT_SECRET
      })
    );
  }

  return providers;
}

export function getAuthProviderAvailability(env: ServerEnv = getServerEnv()): AuthProviderStatus {
  return getAuthProviderStatus(env);
}
