import { createFileRoute } from "@tanstack/react-router";
import { Signup } from "@/views/Signup/Signup";

export const Route = createFileRoute("/signup")({
  component: Signup,
});
