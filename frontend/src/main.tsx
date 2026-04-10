/**
 * エントリ: TanStack Router + React ルート
 */

import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { setApiUnauthorizedHandler } from "./lib/api-client";
import { parseAuthPageSearch, sessionQueryKey } from "./lib/auth-session";
import { createAppQueryClient } from "./lib/query-client";

const queryClient = createAppQueryClient();

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
  context: { queryClient },
});

setApiUnauthorizedHandler(() => {
  void queryClient.invalidateQueries({ queryKey: sessionQueryKey });
  const path = `${window.location.pathname}${window.location.search}`;
  const search =
    path !== "/" && path !== "/login" && path !== "/signup"
      ? parseAuthPageSearch({ redirect: path })
      : {};
  void router.navigate({ to: "/login", search, replace: true });
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const elem = document.getElementById("root")!;
const app = (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);

if (import.meta.hot) {
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(app);
} else {
  createRoot(elem).render(app);
}
