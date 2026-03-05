const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bookmeai.app";

const staticPages = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/login", changefreq: "monthly", priority: "0.8" },
  { path: "/privacy-policy", changefreq: "monthly", priority: "0.3" },
  { path: "/terms-of-service", changefreq: "monthly", priority: "0.3" },
];

export async function GET() {
  const lastmod = new Date().toISOString().split("T")[0];

  const urls = staticPages
    .map(
      (page) => `
    <url>
      <loc>${SITE_URL}${page.path}</loc>
      <lastmod>${lastmod}</lastmod>
      <changefreq>${page.changefreq}</changefreq>
      <priority>${page.priority}</priority>
    </url>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
