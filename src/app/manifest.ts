import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Secret Hour",
    short_name: "Secret Hour",
    description: "私密預約管理",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#E5F6FF",
    theme_color: "#E5F6FF",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
