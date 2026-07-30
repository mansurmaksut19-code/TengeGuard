import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.tengeguard.online",
      lastModified: new Date()
    },
    {
      url: "https://www.tengeguard.online/privacy",
      lastModified: new Date()
    },
    {
      url: "https://www.tengeguard.online/terms",
      lastModified: new Date()
    }
  ];
}
