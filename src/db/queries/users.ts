import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { NewUser, users } from "../schema.js";

export async function createUser(email: string,hashedPassword: string) {
  const [result] = await db
    .insert(users)
    .values({
      email,
      hashedPassword
    })
    .onConflictDoNothing()
    .returning();
  return result;
}
export async function deleteAllUsers() {
  await db.delete(users);
}
export async function findByEmail(email:string) {
  const [result]= await db.select().from(users).where(eq(users.email,email));
  return result;
}
export async function updateAuthedUser(email:string,hashedPassword:string,userId:string) {
  const [updatedUser]=  await db
      .update(users)
      .set({ email, hashedPassword })
      .where(eq(users.id, userId))
      .returning();
  return updatedUser;
}

export async function upgrade (userId:string) {
  const [updatedUser]=  await db
      .update(users)
      .set({ isChirpyRed: true})
      .where(eq(users.id, userId))
      .returning();
  return updatedUser;
}
 