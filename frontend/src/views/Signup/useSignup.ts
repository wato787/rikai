import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getRouteApi, useRouter } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
import { sessionQueryKey } from "@/lib/auth-session";

const signupRouteApi = getRouteApi("/signup");

type SignupCredentials = {
  email: string;
  password: string;
};

/** DB の `user.name` 必須に合わせ、入力なしのときはメールの @ より前を使う */
function defaultNameFromEmail(email: string): string {
  const local = email.trim().split("@")[0]?.trim();
  return local && local.length > 0 ? local : "ユーザー";
}

export const useSignup = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const search = signupRouteApi.useSearch();

  const mutation = useMutation({
    mutationFn: async ({ email, password }: SignupCredentials) => {
      const name = defaultNameFromEmail(email);
      const { error } = await authClient.signUp.email({ name, email, password });
      if (error) {
        throw new Error(error.message ?? "登録に失敗しました。");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      const target = search.redirect ?? "/";
      await router.navigate({ href: target });
    },
  });

  return {
    signup: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};
