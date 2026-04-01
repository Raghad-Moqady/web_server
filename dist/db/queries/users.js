import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { users } from "../schema.js";
export async function createUser(email, hashedPassword) {
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
export async function findByEmail(email) {
    const [result] = await db.select().from(users).where(eq(users.email, email));
    return result;
}
export async function updateAuthedUser(email, hashedPassword, userId) {
    const [updatedUser] = await db
        .update(users)
        .set({ email, hashedPassword })
        .where(eq(users.id, userId))
        .returning();
    return updatedUser;
}
export async function upgrade(userId) {
    const [updatedUser] = await db
        .update(users)
        .set({ isChirpyRed: true })
        .where(eq(users.id, userId))
        .returning();
    return updatedUser;
}
