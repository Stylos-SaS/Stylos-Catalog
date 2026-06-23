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

export async function updateAdminProfile(
  prisma: PrismaClient,
  userId: string,
  input: { nombre: string },
) {
  const admin = await prisma.usuarioAdmin.findUnique({ where: { id: userId } });
  if (!admin) {
    throw new AuthError("Unauthorized", 401);
  }

  const updated = await prisma.usuarioAdmin.update({
    where: { id: userId },
    data: { nombre: input.nombre.trim() },
  });

  return toAdminProfile(updated);
}

export async function changeAdminPassword(
  prisma: PrismaClient,
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const admin = await prisma.usuarioAdmin.findUnique({ where: { id: userId } });
  if (!admin) {
    throw new AuthError("Unauthorized", 401);
  }

  const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!valid) {
    throw new AuthError("Current password is incorrect", 401);
  }

  const samePassword = await bcrypt.compare(newPassword, admin.passwordHash);
  if (samePassword) {
    throw new AuthError("New password must be different from the current password", 409);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.usuarioAdmin.update({
    where: { id: userId },
    data: { passwordHash },
  });
}
