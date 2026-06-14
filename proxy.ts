import { NextResponse, type NextRequest } from "next/server"

import { chooseRepresentation } from "@/lib/http-accept"

function shouldNegotiate(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/agent-markdown") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/.well-known") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/llms.txt" ||
    pathname === "/llms-full.txt" ||
    pathname === "/openapi.json"
  ) {
    return false
  }

  return !/\.[a-z0-9]+$/i.test(pathname)
}

function discoveryLinks(request: NextRequest) {
  const url = request.nextUrl
  const markdownUrl = new URL(url.pathname + url.search, url.origin)

  return [
    `<${markdownUrl.toString()}>; rel="alternate"; type="text/markdown"`,
    `</llms.txt>; rel="alternate"; type="text/plain"; title="LLM index"`,
    `</llms-full.txt>; rel="alternate"; type="text/plain"; title="Full LLM context"`,
    `</.well-known/agent-skills/index.json>; rel="service-desc"; type="application/json"`,
    `</openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json"`,
  ].join(", ")
}

export function proxy(request: NextRequest) {
  if (!shouldNegotiate(request)) {
    return NextResponse.next()
  }

  const representation = chooseRepresentation(request.headers.get("accept"))

  if (!representation) {
    return new NextResponse("Not Acceptable", {
      status: 406,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        Vary: "Accept",
      },
    })
  }

  if (representation === "text/markdown") {
    const rewriteUrl = new URL("/agent-markdown", request.url)
    rewriteUrl.search = request.nextUrl.search
    rewriteUrl.searchParams.set("xenon_path", request.nextUrl.pathname)

    return NextResponse.rewrite(rewriteUrl, {
      headers: {
        "Content-Signal": "ai-input=yes, search=yes, ai-train=no",
        Link: discoveryLinks(request),
        Vary: "Accept",
      },
    })
  }

  const response = NextResponse.next({
    headers: {
      Vary: "Accept",
    },
  })
  response.headers.set(
    "Content-Signal",
    "ai-input=yes, search=yes, ai-train=no"
  )
  response.headers.set("Link", discoveryLinks(request))
  response.headers.set("Vary", "Accept")

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
