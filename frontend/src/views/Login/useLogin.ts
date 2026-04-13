import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getRouteApi, useRouter } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
import { sessionQueryOptions } from "@/lib/auth-session";
import { navigateAfterAuth } from "@/lib/navigate-after-auth";

const loginRouteApi = getRouteApi("/login");

type LoginCredentials = {
  email: string;
  password: string;
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const search = loginRouteApi.useSearch();

  const mutation = useMutation({
    mutationFn: async ({ email, password }: LoginCredentials) => {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) {
        throw new Error(error.message ?? "ログインに失敗しました。");
      }
    },
    onSuccess: async () => {
      await queryClient.fetchQuery(sessionQueryOptions);
      await navigateAfterAuth(router, search.redirect);
    },
  });

  return {
    login: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};
