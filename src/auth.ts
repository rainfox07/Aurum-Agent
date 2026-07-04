import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import { getAuthSecret, getDatabaseUrl } from "@/lib/env";
import { buildAuthProviders } from "@/lib/auth/providers";
import { getDb } from "@/lib/db/client";
import { accounts, authenticators, sessions, users, verificationTokens } from "@/lib/db/schema";

const databaseUrl = getDatabaseUrl();

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: buildAuthProviders(),
  adapter: databaseUrl
    ? DrizzleAdapter(getDb(), {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
        authenticatorsTable: authenticators
      })
    : undefined,
  secret: getAuthSecret(),
  trustHost: true,
  pages: {
    signIn: "/sign-in"
  },
  session: {
    strategy: "jwt"
  }
});
