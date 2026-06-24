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
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
