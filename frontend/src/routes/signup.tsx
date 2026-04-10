import { createFileRoute } from "@tanstack/react-router";
import { parseAuthPageSearch } from "@/lib/auth-session";
import { Signup } from "@/views/Signup/Signup";

export const Route = createFileRoute("/signup")({
  validateSearch: (search) => parseAuthPageSearch(search as Record<string, unknown>),
  component: Signup,
});
