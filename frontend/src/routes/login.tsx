import { createFileRoute } from "@tanstack/react-router";
import { Login } from "@/views/Login/Login";

export const Route = createFileRoute("/login")({
  component: Login,
});
