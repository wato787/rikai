import type { AuthSessionUser } from "./queries";

import { initialsFromUser } from "./initials";

type ProfileAvatarBlockProps = {
  user: Pick<AuthSessionUser, "name" | "email" | "image">;
};

export function ProfileAvatarBlock({ user }: ProfileAvatarBlockProps) {
  return (
    <div className="flex items-center gap-6">
      {user.image ? (
        <img
          src={user.image}
          alt=""
          className="w-20 h-20 rounded-3xl object-cover border-4 border-white shadow-sm shrink-0"
        />
      ) : (
        <div
          className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600 text-2xl font-bold border-4 border-white shadow-sm shrink-0"
          aria-hidden
        >
          {initialsFromUser(user.name, user.email)}
        </div>
      )}
      <div>
        <button
          type="button"
          disabled
          className="px-4 py-2 bg-zinc-200 text-zinc-500 text-xs font-bold rounded-lg cursor-not-allowed mb-2"
        >
          写真を変更
        </button>
        <p className="text-[10px] text-zinc-400 font-medium">
          プロフィール写真のアップロードは近日対応予定です。
        </p>
      </div>
    </div>
  );
}
