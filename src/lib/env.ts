import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().optional(),
  AUTH_SECRET: z.string().optional(),
  AUTH_URL: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  WECHAT_CLIENT_ID: z.string().optional(),
  WECHAT_CLIENT_SECRET: z.string().optional(),
  LLM_BASE_URL: z.string().optional(),
  LLM_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().optional()
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export type AuthProviderStatus = {
  email: boolean;
  google: boolean;
  wechat: boolean;
};

const localAuthSecret = "local-development-auth-secret-at-least-32-characters";

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse(process.env);
}

export function getAuthSecret(env: ServerEnv = getServerEnv()) {
  return isConfiguredValue(env.AUTH_SECRET) ? env.AUTH_SECRET : localAuthSecret;
}

export function getDatabaseUrl(env: ServerEnv = getServerEnv()) {
  return isConfiguredValue(env.DATABASE_URL) ? env.DATABASE_URL : null;
}

export function getAuthProviderStatus(env: ServerEnv = getServerEnv()): AuthProviderStatus {
  return {
    email: isConfiguredValue(env.RESEND_API_KEY) && isConfiguredValue(env.EMAIL_FROM) && isConfiguredValue(env.DATABASE_URL),
    google: isConfiguredValue(env.GOOGLE_CLIENT_ID) && isConfiguredValue(env.GOOGLE_CLIENT_SECRET),
    wechat: isConfiguredValue(env.WECHAT_CLIENT_ID) && isConfiguredValue(env.WECHAT_CLIENT_SECRET)
  };
}

export function getAuthConfigurationError(provider: keyof AuthProviderStatus, env: ServerEnv = getServerEnv()) {
  const status = getAuthProviderStatus(env);
  if (status[provider]) {
    return null;
  }

  if (provider === "email") {
    return "Email login requires RESEND_API_KEY, EMAIL_FROM, and DATABASE_URL.";
  }
  if (provider === "google") {
    return "Google login requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.";
  }
  return "WeChat login requires WECHAT_CLIENT_ID and WECHAT_CLIENT_SECRET.";
}

export function isConfiguredValue(value?: string | null): value is string {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  const placeholderFragments = [
    "replace-with",
    "xxx",
    "example.com",
    "login@example.com",
    "google-client-id",
    "google-client-secret",
    "postgres://user:password"
  ];

  return !placeholderFragments.some((fragment) => normalized.includes(fragment));
}
