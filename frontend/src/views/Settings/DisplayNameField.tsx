import { useId, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { updateUserDisplayNameMutationOptions } from "./mutations";

type DisplayNameFieldProps = {
  /** サーバー上の表示名（保存後の refetch で `key` と合わせて同期する） */
  defaultName: string;
};

/**
 * 表示名編集。親から `key={user.updatedAt}` 等を渡し、サーバー値との同期は effect ではなく remount で行う。
 */
export function DisplayNameField({ defaultName }: DisplayNameFieldProps) {
  const queryClient = useQueryClient();
  const errorId = useId();
  const [name, setName] = useState(defaultName);

  const mutation = useMutation(updateUserDisplayNameMutationOptions(queryClient));

  const trimmed = name.trim();
  const trimmedDefault = defaultName.trim();
  const canSave = trimmed.length > 0 && trimmed !== trimmedDefault;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSave || mutation.isPending) return;
    mutation.mutate(trimmed);
  };

  return (
    <div className="space-y-2 md:col-span-2">
      <label htmlFor="settings-display-name" className="text-xs font-bold text-zinc-500">
        表示名
      </label>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          id="settings-display-name"
          type="text"
          name="displayName"
          value={name}
          onChange={(e) => {
            mutation.reset();
            setName(e.target.value);
          }}
          autoComplete="name"
          aria-invalid={mutation.isError}
          aria-describedby={mutation.isError ? errorId : undefined}
          className="flex-1 min-w-0 px-4 py-2.5 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
        <button
          type="submit"
          disabled={!canSave || mutation.isPending}
          className="shrink-0 px-5 py-2.5 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2"
        >
          {mutation.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden />
              保存中…
            </>
          ) : (
            "保存"
          )}
        </button>
      </form>
      {mutation.isError ? (
        <p id={errorId} className="text-sm text-red-600 font-medium" role="alert">
          {mutation.error instanceof Error
            ? mutation.error.message
            : "表示名の更新に失敗しました。"}
        </p>
      ) : null}
    </div>
  );
}
