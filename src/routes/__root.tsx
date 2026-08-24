import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { AppShell } from "@/components/layout/app-shell";
import appCss from "../styles.css?url";

const APP_NAME = "GốcPro";
const spa = import.meta.env.VITE_SPA === "1";
const base = import.meta.env.BASE_URL;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      { name: "theme-color", content: "#1C2418" },
      {
        name: "description",
        content: "Sổ bán hàng phân bón gốc — đại lý, đơn hàng, vận chuyển, thống kê tấn và doanh thu. Hoạt động offline.",
      },
      { name: "apple-mobile-web-app-capable", content: "yes" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: `${base}favicon.svg` },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: `${base}__grok/manifest.webmanifest` },
      { rel: "apple-touch-icon", href: `${base}__grok/icon-180.png` },
    ],
  }),
  component: RootComponent,
});

function Inner() {
  return (
    <>
      <PreviewHostBridge />
      <AuthProvider>
        <AppShell>
          <Outlet />
        </AppShell>
      </AuthProvider>
    </>
  );
}

function RootComponent() {
  if (spa) return <Inner />;
  return (
    <html lang="vi" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <Inner />
        <Scripts />
      </body>
    </html>
  );
}
