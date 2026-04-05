import { User } from "lucide-react";

import type { AuthSessionUser, SessionPayload } from "./queries";

import { BillingSection } from "./BillingSection";
import { DisplayNameField } from "./DisplayNameField";
import { ProfileAvatarBlock } from "./ProfileAvatarBlock";

export type SettingsProps = {
  session: SessionPayload | null;
};

/** サーバー由来の user が変わったときだけ子を remount し、effect で state を同期しない */
function sessionResetKey(user: AuthSessionUser): string {
  return `${user.id}:${String(user.updatedAt)}:${user.name}`;
}

function SettingsSessionFallback() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center text-zinc-500 font-medium">
      セッションを読み込めませんでした。
    </div>
  );
}

function SettingsPageHeader() {
  return (
    <header className="mb-12">
      <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-2">設定</h1>
      <p className="text-sm text-zinc-400 font-medium">
        アカウントとアプリケーションの環境設定を管理します。
      </p>
    </header>
  );
}

function ProfileSection({ user }: { user: AuthSessionUser }) {
  return (
    <section>
      <h2 className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
        <User size={14} />
        プロフィール
      </h2>
      <div className="bg-white border border-zinc-100 rounded-2xl p-8 shadow-sm space-y-8">
        <ProfileAvatarBlock user={user} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DisplayNameField key={sessionResetKey(user)} defaultName={user.name} />

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="settings-email" className="text-xs font-bold text-zinc-500">
              メールアドレス
            </label>
            <input
              id="settings-email"
              type="email"
              readOnly
              value={user.email}
              className="w-full px-4 py-2.5 bg-zinc-100 border border-zinc-200 rounded-xl text-sm text-zinc-600 cursor-not-allowed"
              aria-readonly="true"
            />
            <p className="text-[10px] text-zinc-400 font-medium">
              メールアドレスの変更は別途対応予定です。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Settings({ session }: SettingsProps) {
  if (!session?.user) {
    return <SettingsSessionFallback />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <SettingsPageHeader />
      <div className="space-y-12">
        <ProfileSection user={session.user} />
        <BillingSection />
      </div>
    </div>
  );
}
