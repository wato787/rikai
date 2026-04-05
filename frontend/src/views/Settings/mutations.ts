import { mutationOptions, type QueryClient } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";

import { sessionQueryKey } from "./queries";

export function updateUserDisplayNameMutationOptions(queryClient: QueryClient) {
  return mutationOptions({
    mutationFn: async (nextName: string) => {
      const { error } = await authClient.updateUser({ name: nextName });
      if (error) {
        throw new Error(error.message ?? "表示名の更新に失敗しました。");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
    },
  });
}
