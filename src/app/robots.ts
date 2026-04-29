import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://premiumreklam.shop";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/dashboard/settings"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
