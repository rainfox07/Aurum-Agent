import { NextResponse } from "next/server";
import { getAuthConfigurationError, getAuthProviderStatus } from "@/lib/env";

export async function GET() {
  const providers = getAuthProviderStatus();

  return NextResponse.json({
    providers,
    errors: {
      email: getAuthConfigurationError("email"),
      google: getAuthConfigurationError("google"),
      wechat: getAuthConfigurationError("wechat")
    }
  });
}
