import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

import { sessionQueryKey } from "./queries";

export type SignupCredentials = {
  name: string;
  email: string;
  password: string;
};

export const useSignup = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async ({ name, email, password }: SignupCredentials) => {
      const { error } = await authClient.signUp.email({ name, email, password });
      if (error) {
        throw new Error(error.message ?? "登録に失敗しました。");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      await navigate({ to: "/" });
    },
  });

  return {
    signup: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};
