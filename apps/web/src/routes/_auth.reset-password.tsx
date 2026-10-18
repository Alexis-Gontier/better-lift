import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export const Route = createFileRoute("/_auth/reset-password")({
  component: ResetPasswordForm,
});
