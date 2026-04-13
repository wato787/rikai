import type { RegisteredRouter } from "@tanstack/react-router";

/**
 * `redirect` クエリや既定パスから、ファイルルートに合わせて遷移する。
 * （`href` だけの navigate は型付きルータで効かないことがある）
 */
export async function navigateAfterAuth(
  router: RegisteredRouter,
  redirectPath: string | undefined,
): Promise<void> {
  const raw = redirectPath ?? "/";
  const q = raw.indexOf("?");
  const pathname = (q === -1 ? raw : raw.slice(0, q)).replace(/\/$/, "") || "/";
  const searchStr = q === -1 ? "" : raw.slice(q + 1);
  const search = searchStr ? Object.fromEntries(new URLSearchParams(searchStr).entries()) : {};

  if (pathname === "/") {
    await router.navigate({ to: "/", search, replace: true });
    return;
  }
  if (pathname === "/settings") {
    await router.navigate({ to: "/settings", search, replace: true });
    return;
  }
  const m = /^\/roadmap\/([^/?#]+)$/.exec(pathname);
  const roadmapId = m?.[1];
  if (roadmapId) {
    await router.navigate({
      to: "/roadmap/$roadmapId",
      params: { roadmapId },
      search,
      replace: true,
    });
    return;
  }
  await router.navigate({ to: "/", replace: true });
}
