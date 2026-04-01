import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { chirps } from "../schema.js";

export async function createChirp(body: string, userId: string) {
  const [result] = await db
    .insert(chirps)
    .values({
      body,
      userId,
    })
    .returning();

  return result;
}
export async function getAllChirps() {
    return await db.select().from(chirps).orderBy(chirps.createdAt);
}
export async function getAllChirpsForAuthorId(userId:string) {
    return await db.select().from(chirps).where(eq(chirps.userId,userId));
}

export async function getChirpById(id:string) {
   const result= await db.select().from(chirps).where(eq(chirps.id,id));
   return  result[0];
}

export async function deleteChirp(id:string) {
    await db.delete(chirps).where(eq(chirps.id, id));
}
