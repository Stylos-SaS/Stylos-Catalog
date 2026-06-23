import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertCircle, Instagram, Loader2, LockKeyhole, Mail, MapPin, MessageCircle, Save, User } from "lucide-react";
import { adminInitials } from "@/lib/auth-storage";
import {
  useAdminProfile,
  useAdminStoreSettings,
  useChangeAdminPassword,
  useUpdateAdminProfile,
  useUpdateStoreContact,
  useUpdateStoreWhatsApp,
} from "@/lib/admin-profile-queries";
import { formatPhoneDisplay, isValidWhatsAppPhone, normalizeWhatsAppPhone } from "@/lib/phone";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Stylos Admin" }] }),
  component: Profile,
});

function whatsAppToDisplayInput(number: string): string {
  const digits = number.replace(/\D/g, "");
  const local = digits.startsWith("57") && digits.length === 12 ? digits.slice(2) : digits;
  return formatPhoneDisplay(local);
}

function normalizeInstagramInput(raw: string): string {
  return raw.trim().replace(/^@+/, "");
}

function Profile() {
  const profileQuery = useAdminProfile();
  const storeSettingsQuery = useAdminStoreSettings();
  const updateProfile = useUpdateAdminProfile();
  const changePassword = useChangeAdminPassword();
  const updateStoreWhatsApp = useUpdateStoreWhatsApp();
  const updateStoreContact = useUpdateStoreContact();

  const [nombre, setNombre] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [whatsappInput, setWhatsappInput] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactInstagram, setContactInstagram] = useState("");
  const [contactLocation, setContactLocation] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  const loading = profileQuery.isLoading || storeSettingsQuery.isLoading;
  const loadError = profileQuery.error ?? storeSettingsQuery.error;

  useEffect(() => {
    if (profileQuery.data) {
      setNombre(profileQuery.data.nombre);
    }
  }, [profileQuery.data]);

  useEffect(() => {
    if (storeSettingsQuery.data) {
      setWhatsappInput(whatsAppToDisplayInput(storeSettingsQuery.data.whatsappNumber));
      setContactEmail(storeSettingsQuery.data.contactEmail);
      setContactInstagram(storeSettingsQuery.data.contactInstagram);
      setContactLocation(storeSettingsQuery.data.contactLocation);
    }
  }, [storeSettingsQuery.data]);

  const displayName = nombre.trim() || profileQuery.data?.nombre || "Administrador";
  const username = profileQuery.data?.username ?? "admin";
  const whatsappValid = isValidWhatsAppPhone(whatsappInput);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim());
  const instagramValid = normalizeInstagramInput(contactInstagram).length > 0;
  const locationValid = contactLocation.trim().length > 0;

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!nombre.trim()) return;
    await updateProfile.mutateAsync({ nombre: nombre.trim() });
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas nuevas no coinciden.");
      return;
    }

    await changePassword.mutateAsync({ currentPassword, newPassword });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSaveWhatsApp = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = normalizeWhatsAppPhone(whatsappInput);
    if (!normalized) return;
    await updateStoreWhatsApp.mutateAsync({ whatsappNumber: normalized });
  };

  const handleSaveContact = async (event: React.FormEvent) => {
    event.preventDefault();
    setContactError(null);

    const email = contactEmail.trim();
    const instagram = normalizeInstagramInput(contactInstagram);
    const location = contactLocation.trim();

    if (!emailValid) {
      setContactError("Ingresa un email válido.");
      return;
    }
    if (!instagram) {
      setContactError("Ingresa un usuario de Instagram válido.");
      return;
    }
    if (!location) {
      setContactError("Ingresa una dirección válida.");
      return;
    }

    await updateStoreContact.mutateAsync({
      contactEmail: email,
      contactInstagram: instagram,
      contactLocation: location,
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {loadError instanceof Error ? loadError.message : "No se pudo cargar el perfil"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">
          Personaliza tu cuenta, el WhatsApp de pedidos y el contacto del catálogo.
        </p>
      </div>

      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-xl">
            <User className="h-5 w-5" />
            Mi cuenta
          </CardTitle>
          <CardDescription>Tu nombre visible en el panel de administración.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSaveProfile(e)} className="space-y-5">
            <div className="flex items-center gap-5">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-brand text-xl font-bold text-primary-foreground shadow-pop">
                {adminInitials(displayName)}
              </div>
              <div className="text-sm text-muted-foreground">
                Las iniciales se actualizan al escribir tu nombre.
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                maxLength={80}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input id="username" value={username} readOnly disabled className="bg-muted/50" />
              <p className="text-xs text-muted-foreground">El usuario de inicio de sesión no se puede cambiar.</p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateProfile.isPending || !nombre.trim()}>
                {updateProfile.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-xl">
            <LockKeyhole className="h-5 w-5" />
            Seguridad
          </CardTitle>
          <CardDescription>Cambia tu contraseña de acceso al panel.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleChangePassword(e)} className="space-y-4">
            {passwordError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña actual</Label>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={
                  changePassword.isPending ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
                }
              >
                {changePassword.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LockKeyhole className="h-4 w-4" />
                )}
                Cambiar contraseña
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-xl">
            <MessageCircle className="h-5 w-5" />
            WhatsApp de la tienda
          </CardTitle>
          <CardDescription>
            Número al que se redirigen los pedidos de clientes desde el catálogo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSaveWhatsApp(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">Número de WhatsApp</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">+57</span>
                <Input
                  id="whatsapp"
                  type="tel"
                  inputMode="numeric"
                  placeholder="300 123 4567"
                  value={whatsappInput}
                  onChange={(e) => setWhatsappInput(formatPhoneDisplay(e.target.value))}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">Formato: 300 123 4567 (10 dígitos, empieza por 3).</p>
              {whatsappInput.trim() && !whatsappValid && (
                <p className="text-xs text-destructive">Número inválido.</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateStoreWhatsApp.isPending || !whatsappValid}>
                {updateStoreWhatsApp.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-xl">
            <Mail className="h-5 w-5" />
            Contacto del catálogo
          </CardTitle>
          <CardDescription>
            Email, Instagram y dirección que se muestran en el footer del catálogo. El teléfono y
            WhatsApp de pedidos usan el número configurado arriba.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSaveContact(e)} className="space-y-4">
            {contactError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{contactError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email</Label>
              <Input
                id="contactEmail"
                type="email"
                autoComplete="email"
                placeholder="hola@stylos.co"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactInstagram">Instagram</Label>
              <div className="flex items-center gap-2">
                <Instagram className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  id="contactInstagram"
                  placeholder="stylos.variedades"
                  value={contactInstagram}
                  onChange={(e) => setContactInstagram(e.target.value)}
                  maxLength={80}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Sin @ al inicio. Se mostrará como @{normalizeInstagramInput(contactInstagram) || "usuario"}.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactLocation">Dirección</Label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  id="contactLocation"
                  placeholder="Calle 10 # 5-20, Bogotá"
                  value={contactLocation}
                  onChange={(e) => setContactLocation(e.target.value)}
                  maxLength={200}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Se muestra en la sección de contacto del footer.
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={
                  updateStoreContact.isPending || !emailValid || !instagramValid || !locationValid
                }
              >
                {updateStoreContact.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
