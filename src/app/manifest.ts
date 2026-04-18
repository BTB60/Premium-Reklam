import type { MetadataRoute } from "next";

/** PWA manifest — Next.js serves this at `/manifest.webmanifest` (see layout metadata). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Premium Reklam",
    short_name: "Premium Reklam",
    description: "Reklam və dekor xidmətləri — Bakı, Azərbaycan",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#C41E3A",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
