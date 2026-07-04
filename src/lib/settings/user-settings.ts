import { z } from "zod";

export const userSettingsInputSchema = z.object({
  displayName: z.string().trim().max(80).optional().or(z.literal("")),
  aiCallsUser: z.string().trim().max(80).optional().or(z.literal("")),
  aiTone: z.string().trim().max(240).optional().or(z.literal(""))
});

export type UserSettingsInput = z.infer<typeof userSettingsInputSchema>;
