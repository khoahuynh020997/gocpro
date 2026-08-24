import { createHashHistory, createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const spa = import.meta.env.VITE_SPA === "1";
  return createRouter({
    routeTree,
    history: spa ? createHashHistory() : undefined,
    defaultErrorComponent: AppErrorComponent,
  });
}
