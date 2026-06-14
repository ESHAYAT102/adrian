import {
  SITE_DESCRIPTION,
  SITE_NAME,
  getBaseUrl,
  jsonResponse,
} from "@/lib/agent-discovery"

export async function GET(request: Request) {
  const baseUrl = getBaseUrl(request)

  return jsonResponse({
    schema_version: "v1",
    name_for_human: SITE_NAME,
    name_for_model: "xenon",
    description_for_human: SITE_DESCRIPTION,
    description_for_model:
      "Browse public GitHub profiles, repositories, README files, and selected repository files. Prefer Markdown by sending Accept: text/markdown.",
    auth: { type: "none" },
    api: {
      type: "openapi",
      url: `${baseUrl}/openapi.json`,
      is_user_authenticated: false,
    },
    logo_url: `${baseUrl}/favicon.ico`,
    contact_email: "support@example.com",
    legal_info_url: `${baseUrl}/llms.txt`,
  })
}
