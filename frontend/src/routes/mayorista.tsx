import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/mayorista")({
  beforeLoad: () => {
    throw redirect({ to: "/catalogo" });
  },
});
