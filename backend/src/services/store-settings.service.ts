import type { PrismaClient } from "../generated/prisma/client.js";
import { config } from "../config.js";
import { normalizeWhatsAppPhone } from "../lib/phone.js";

export class StoreSettingsError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "StoreSettingsError";
  }
}

const DEFAULT_STORE_ID = "default";

export type StoreSettings = {
  whatsappNumber: string;
  contactEmail: string;
  contactInstagram: string;
  contactLocation: string;
};

export type UpdateStoreSettingsInput = {
  whatsappNumber?: string;
  contactEmail?: string;
  contactInstagram?: string;
  contactLocation?: string;
};

function normalizeInstagramHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "");
}

function toStoreSettings(row: {
  whatsappNumero: string;
  contactoEmail: string;
  contactoInstagram: string;
  contactoUbicacion: string;
}): StoreSettings {
  return {
    whatsappNumber: row.whatsappNumero,
    contactEmail: row.contactoEmail,
    contactInstagram: row.contactoInstagram,
    contactLocation: row.contactoUbicacion,
  };
}

function envFallbackSettings(): StoreSettings {
  return {
    whatsappNumber: config.WHATSAPP_NUMBER,
    contactEmail: config.STORE_CONTACT_EMAIL,
    contactInstagram: config.STORE_CONTACT_INSTAGRAM,
    contactLocation: config.STORE_CONTACT_LOCATION,
  };
}

export async function getWhatsAppNumber(prisma: PrismaClient): Promise<string> {
  const settings = await getStoreSettings(prisma);
  return settings.whatsappNumber;
}

export async function getStoreSettings(prisma: PrismaClient): Promise<StoreSettings> {
  try {
    const settings = await prisma.configuracionTienda.findUnique({
      where: { id: DEFAULT_STORE_ID },
    });

    if (!settings) {
      return envFallbackSettings();
    }

    return toStoreSettings(settings);
  } catch {
    return envFallbackSettings();
  }
}

export async function updateStoreSettings(
  prisma: PrismaClient,
  input: UpdateStoreSettingsInput,
): Promise<StoreSettings> {
  const updateData: {
    whatsappNumero?: string;
    contactoEmail?: string;
    contactoInstagram?: string;
    contactoUbicacion?: string;
  } = {};

  if (input.whatsappNumber !== undefined) {
    const normalized = normalizeWhatsAppPhone(input.whatsappNumber);
    if (!normalized) {
      throw new StoreSettingsError(
        "Invalid WhatsApp number. Use a Colombian mobile number (10 digits starting with 3).",
        400,
      );
    }
    updateData.whatsappNumero = normalized;
  }

  if (input.contactEmail !== undefined) {
    const email = input.contactEmail.trim();
    if (!email || !email.includes("@")) {
      throw new StoreSettingsError("Invalid contact email.", 400);
    }
    updateData.contactoEmail = email;
  }

  if (input.contactInstagram !== undefined) {
    const handle = normalizeInstagramHandle(input.contactInstagram);
    if (!handle || handle.length > 80) {
      throw new StoreSettingsError("Invalid Instagram handle.", 400);
    }
    updateData.contactoInstagram = handle;
  }

  if (input.contactLocation !== undefined) {
    const location = input.contactLocation.trim();
    if (!location || location.length > 200) {
      throw new StoreSettingsError("Invalid contact location.", 400);
    }
    updateData.contactoUbicacion = location;
  }

  const fallback = envFallbackSettings();
  const normalizedWhatsapp =
    updateData.whatsappNumero ??
    normalizeWhatsAppPhone(config.WHATSAPP_NUMBER) ??
    config.WHATSAPP_NUMBER;

  const settings = await prisma.configuracionTienda.upsert({
    where: { id: DEFAULT_STORE_ID },
    create: {
      id: DEFAULT_STORE_ID,
      whatsappNumero: normalizedWhatsapp,
      contactoEmail: updateData.contactoEmail ?? fallback.contactEmail,
      contactoInstagram: updateData.contactoInstagram ?? fallback.contactInstagram,
      contactoUbicacion: updateData.contactoUbicacion ?? fallback.contactLocation,
    },
    update: updateData,
  });

  return toStoreSettings(settings);
}

/** @deprecated Use updateStoreSettings */
export async function updateWhatsAppNumber(prisma: PrismaClient, raw: string) {
  return updateStoreSettings(prisma, { whatsappNumber: raw });
}

export async function seedStoreSettings(prisma: PrismaClient) {
  const fallback = envFallbackSettings();
  const whatsappNumero =
    normalizeWhatsAppPhone(fallback.whatsappNumber) ?? fallback.whatsappNumber;

  await prisma.configuracionTienda.upsert({
    where: { id: DEFAULT_STORE_ID },
    create: {
      id: DEFAULT_STORE_ID,
      whatsappNumero,
      contactoEmail: fallback.contactEmail,
      contactoInstagram: fallback.contactInstagram,
      contactoUbicacion: fallback.contactLocation,
    },
    update: {},
  });
}
