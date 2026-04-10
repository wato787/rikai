import { createFileRoute } from "@tanstack/react-router";
import { parseAuthPageSearch } from "@/lib/auth-session";
import { Login } from "@/views/Login/Login";

export const Route = createFileRoute("/login")({
  validateSearch: (search) => parseAuthPageSearch(search as Record<string, unknown>),
  component: Login,
});
