import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico"],
      manifest: {
        name: "Seoul Pins",
        short_name: "SeoulPins",
        description: "自建景點 / 餐廳清單（PWA）",
        start_url: "/",
        display: "standalone",
        background_color: "#000000",
        theme_color: "#000000",
        icons: [
          {
            src: "/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
          },
      
        ],
      },
      workbox: {
    navigateFallback: "/index.html",
    runtimeCaching: [
      // cache 地圖瓦片（OSM/CARTO）— 沒網路時可用「曾經看過的」瓦片
      {
        urlPattern: ({ url }) =>
          url.hostname.includes("basemaps.cartocdn.com") ||
          url.hostname.includes("tile.openstreetmap.org"),
        handler: "CacheFirst",
        options: {
          cacheName: "map-tiles",
          expiration: {
            maxEntries: 500,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 7天
          },
        },
      },
    ],
  },
    }),
  ],
});
