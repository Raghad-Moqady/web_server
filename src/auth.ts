import argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { Request } from "express";
import crypto from "crypto";
import { UnauthorizedError } from "./customErrorClasses.js";


export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password);
}

export async function checkPasswordHash(
  password: string,
  hash: string
): Promise<boolean> {
  return await argon2.verify(hash, password);
}

type Payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

export function makeJWT(userID: string, expiresIn: number, secret: string) :string{ 
 const iat = Math.floor(Date.now() / 1000);

  const payload: Payload = {
    iss: "chirpy",
    sub: userID,
    iat,
    exp: iat + expiresIn,
  };

  return jwt.sign(payload, secret);
};
 
 
export function validateJWT(tokenString: string, secret: string): string {
  try {
    const decoded = jwt.verify(tokenString, secret) as JwtPayload;

    if (!decoded.sub) {
      throw new UnauthorizedError("Invalid token");
    }
    return decoded.sub as string;
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}


export function getBearerToken(req: Request): string {
  const authHeader = req.get("Authorization");

  if (!authHeader) {
    throw new UnauthorizedError("Authorization header missing");
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw new UnauthorizedError("Invalid authorization format");
  }

  return parts[1];
}

export function makeRefreshToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function getAPIKey(req: Request): string {
  const authHeader = req.get("Authorization");

  if (!authHeader) {
    throw new UnauthorizedError("Authorization header missing");
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "ApiKey") {
    throw new UnauthorizedError("Invalid authorization format");
  }

  return parts[1];
}

