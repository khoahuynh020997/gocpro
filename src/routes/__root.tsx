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
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: APP_NAME },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
    ],
    links: [
      { rel: "icon", type: "image/png", sizes: "32x32", href: `${base}favicon-32.png` },
      { rel: "icon", type: "image/png", sizes: "192x192", href: `${base}icon-192.png` },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: `${base}manifest.webmanifest` },
      { rel: "apple-touch-icon", href: `${base}apple-touch-icon.png` },
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
