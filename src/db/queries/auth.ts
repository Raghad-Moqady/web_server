import { eq } from "drizzle-orm";
 import { refreshTokens } from "../schema.js";
import { db } from "../index.js";

export async function createRefreshToken(token: string, userId: string) {
  const [result] = await db
    .insert(refreshTokens)
    .values({
      token,
      userId,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    })
    .returning();

  return result;
}

export async function getRefreshToken(token: string) {
  const [result] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.token, token));

  return result;
}
export async function revokeRefreshToken(token: string) {
  await db
    .update(refreshTokens)
    .set({
      revokedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(refreshTokens.token, token));
}