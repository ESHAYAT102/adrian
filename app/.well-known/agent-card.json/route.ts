import {
  SITE_DESCRIPTION,
  SITE_NAME,
  getBaseUrl,
  jsonResponse,
} from "@/lib/agent-discovery"

export async function GET(request: Request) {
  const baseUrl = getBaseUrl(request)

  return jsonResponse({
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    version: "0.1.0",
    url: baseUrl,
    documentationUrl: `${baseUrl}/llms-full.txt`,
    provider: {
      organization: "Xenon",
      url: baseUrl,
    },
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: false,
    },
    defaultInputModes: ["text/plain"],
    defaultOutputModes: ["text/markdown", "text/html"],
    skills: [
      {
        id: "github-public-repository-discovery",
        name: "GitHub public repository discovery",
        description:
          "Inspect public GitHub profiles, repositories, README files, root contents, and selected files through Xenon URLs.",
        tags: ["github", "repositories", "markdown", "discovery"],
        examples: [
          `${baseUrl}/vercel/next.js`,
          `${baseUrl}/facebook/react?path=README.md`,
        ],
      },
    ],
    securitySchemes: {},
    security: [],
  })
}
