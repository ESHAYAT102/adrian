export async function GET(request: Request) {
  const baseUrl = new URL(request.url).origin

  return new Response(`User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
Host: ${baseUrl}
`, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}
