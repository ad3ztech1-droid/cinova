// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    // Older TV browsers (Hisense VIDAA, older Tizen/webOS) need a lower JS target.
    build: { target: ["es2019", "chrome69", "safari12"] },
    plugins: [
      VitePWA({
        strategies: "generateSW",
        registerType: "autoUpdate",
        injectRegister: null, // registration happens only in src/lib/pwa-register.ts
        filename: "sw.js",
        manifest: false, // we ship public/manifest.webmanifest ourselves
        devOptions: { enabled: false },
        workbox: {
          navigateFallback: null,
          runtimeCaching: [
            {
              // HTML navigations: always prefer the network
              urlPattern: ({ request }: { request: Request }) => request.mode === "navigate",
              handler: "NetworkFirst",
              options: {
                cacheName: "lumiere-pages",
                networkTimeoutSeconds: 5,
              },
            },
            {
              // Same-origin hashed build assets only
              urlPattern: ({ url, request }: { url: URL; request: Request }) =>
                url.origin === self.location.origin &&
                request.mode !== "navigate" &&
                /\/assets\/.+\.[a-f0-9]{8,}\./i.test(url.pathname),
              handler: "CacheFirst",
              options: { cacheName: "lumiere-assets" },
            },
          ],
        },
      }),
    ],
  },
});
