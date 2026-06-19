import { Instagram, MessageCircle, Mail, MapPin } from "lucide-react";
import logo from "@/assets/stylos-logo.jpeg";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-gradient-soft">
      <div className="mx-auto max-w-7xl px-6 py-12 grid gap-10 md:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="h-10 w-10 rounded-full" />
            <div>
              <div className="font-display font-semibold">Stylos Variedades</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                hogar · regalos · belleza
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Una pequeña tienda con corazón grande. Detalles bonitos para cada momento.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3">Contacto</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-primary" /> +57 301 403 9265</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> hola@stylos.co</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Colombia</li>
            <li className="flex items-center gap-2"><Instagram className="h-4 w-4 text-primary" /> @stylos.variedades</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-4 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Stylos Variedades. Hecho con amor 💕</span>
          <span>Términos · Privacidad</span>
        </div>
      </div>
    </footer>
  );
}
