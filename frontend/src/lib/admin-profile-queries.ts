import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  changeAdminPassword,
  fetchAdminProfile,
  updateAdminProfile,
} from "./api";
import {
  fetchStoreSettings,
  updateStoreSettings,
} from "./admin-api";
import { ApiError } from "./api-core";
import { useAuth } from "./auth";
import { storeSettingsKeys } from "./queries";

export const adminProfileKeys = {
  all: ["admin", "profile"] as const,
};

export function adminProfileQueryOptions() {
  return queryOptions({
    queryKey: adminProfileKeys.all,
    queryFn: fetchAdminProfile,
    select: (data) => data.user,
  });
}

export function adminStoreSettingsQueryOptions() {
  return queryOptions({
    queryKey: [...storeSettingsKeys.all, "admin"] as const,
    queryFn: fetchStoreSettings,
  });
}

export function useAdminProfile() {
  return useQuery(adminProfileQueryOptions());
}

export function useAdminStoreSettings() {
  return useQuery(adminStoreSettingsQueryOptions());
}

export function useUpdateAdminProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuth((s) => s.setUser);

  return useMutation({
    mutationFn: (payload: { nombre: string }) => updateAdminProfile(payload),
    onSuccess: ({ user }) => {
      setUser(user);
      queryClient.setQueryData(adminProfileQueryOptions().queryKey, { user });
      toast.success("Perfil actualizado");
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : "No se pudo actualizar el perfil";
      toast.error(message);
    },
  });
}

export function useChangeAdminPassword() {
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      changeAdminPassword(payload),
    onSuccess: () => {
      toast.success("Contraseña actualizada");
    },
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? err.status === 401
            ? "La contraseña actual es incorrecta"
            : err.status === 409
              ? "La nueva contraseña debe ser diferente a la actual"
              : err.message
          : "No se pudo cambiar la contraseña";
      toast.error(message);
    },
  });
}

function syncStoreSettingsCache(
  queryClient: ReturnType<typeof useQueryClient>,
  data: Awaited<ReturnType<typeof updateStoreSettings>>,
) {
  queryClient.setQueryData(adminStoreSettingsQueryOptions().queryKey, data);
  queryClient.setQueryData(storeSettingsKeys.all, data);
}

export function useUpdateStoreWhatsApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { whatsappNumber: string }) =>
      updateStoreSettings({ whatsappNumber: payload.whatsappNumber }),
    onSuccess: (data) => {
      syncStoreSettingsCache(queryClient, data);
      toast.success("Número de WhatsApp actualizado");
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : "No se pudo guardar el número de WhatsApp";
      toast.error(message);
    },
  });
}

export function useUpdateStoreContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { contactEmail: string; contactInstagram: string }) =>
      updateStoreSettings(payload),
    onSuccess: (data) => {
      syncStoreSettingsCache(queryClient, data);
      toast.success("Contacto del catálogo actualizado");
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : "No se pudo guardar el contacto";
      toast.error(message);
    },
  });
}
