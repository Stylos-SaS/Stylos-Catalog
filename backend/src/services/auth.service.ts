import bcrypt from "bcrypt";
import type { PrismaClient } from "../generated/prisma/client.js";

export class AuthError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export async function verifyAdminCredentials(
  prisma: PrismaClient,
  username: string,
  password: string,
) {
  const admin = await prisma.usuarioAdmin.findUnique({
    where: { username },
  });

  if (!admin) {
    throw new AuthError("Invalid username or password", 401);
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    throw new AuthError("Invalid username or password", 401);
  }

  return admin;
}

export function toAdminProfile(admin: { id: string; username: string; nombre: string }) {
  return {
    id: admin.id,
    username: admin.username,
    nombre: admin.nombre,
  };
}
