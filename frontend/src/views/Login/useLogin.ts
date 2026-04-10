import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getRouteApi, useRouter } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
import { sessionQueryKey } from "@/lib/auth-session";

const loginRouteApi = getRouteApi("/login");

export type LoginCredentials = {
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
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      const target = search.redirect ?? "/";
      await router.navigate({ href: target });
    },
  });

  return {
    login: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};
