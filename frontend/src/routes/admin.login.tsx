import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, LockKeyhole, AlertCircle } from "lucide-react";
import logo from "@/assets/stylos-logo.jpeg";
import { ApiError, loginAdmin } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getPersistedAuthToken } from "@/lib/auth-storage";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/login")({
  beforeLoad: () => {
    if (getPersistedAuthToken()) {
      throw redirect({ to: "/admin" });
    }
  },
  head: () => ({ meta: [{ title: "Iniciar sesión — Stylos Admin" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const setSession = useAuth((s) => s.setSession);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError("Ingresa usuario y contraseña.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await loginAdmin({ username: username.trim(), password });
      setSession(result.token, result.user);
      navigate({ to: "/admin" });
    } catch (err) {
      let message: string;
      if (err instanceof ApiError && err.status === 401) {
        message = "Las credenciales ingresadas son incorrectas. Verifica tu usuario y contraseña.";
      } else if (err instanceof ApiError && err.status === 429) {
        message = "Demasiados intentos de inicio de sesión. Espera unos minutos e inténtalo de nuevo.";
        try {
          const body = JSON.parse(err.message) as { retryAfter?: string };
          if (body.retryAfter) {
            message = `Demasiados intentos de inicio de sesión. Vuelve a intentarlo en ${body.retryAfter}.`;
          }
        } catch {
          // usar mensaje por defecto
        }
      } else {
        message =
          err instanceof Error ? err.message : "No se pudo iniciar sesión. Intenta de nuevo.";
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-soft px-4 py-10">
      <Card className="w-full max-w-md border-border/60 shadow-pop">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-card shadow-soft">
            <img src={logo} alt="Stylos Variedades" className="h-full w-full object-cover" />
          </div>
          <div>
            <CardTitle className="font-display text-2xl">Stylos Admin</CardTitle>
            <CardDescription>Ingresa tus credenciales para acceder al panel.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="admin"
                aria-invalid={Boolean(error)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="••••••••"
                aria-invalid={Boolean(error)}
              />
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ingresando...
                </>
              ) : (
                <>
                  <LockKeyhole className="mr-2 h-4 w-4" /> Iniciar sesión
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
