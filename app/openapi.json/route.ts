import { getBaseUrl, jsonResponse } from "@/lib/agent-discovery"

export async function GET(request: Request) {
  const baseUrl = getBaseUrl(request)

  return jsonResponse({
    openapi: "3.1.0",
    info: {
      title: "Xenon Public Routes",
      version: "0.1.0",
      description:
        "Machine-readable description of Xenon's public GitHub browsing routes and LLM discovery endpoints.",
    },
    servers: [{ url: baseUrl }],
    paths: {
      "/": {
        get: {
          summary: "Xenon home page",
          description:
            "Returns the Xenon web UI as HTML or a concise Markdown overview when requested with Accept: text/markdown.",
          responses: {
            "200": {
              description: "HTML or Markdown home representation",
            },
            "406": { description: "Unsupported Accept header" },
          },
        },
      },
      "/{username}": {
        get: {
          summary: "GitHub profile",
          parameters: [
            {
              in: "path",
              name: "username",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description:
                "GitHub profile and public repositories as HTML or Markdown.",
            },
          },
        },
      },
      "/{username}/{repo}": {
        get: {
          summary: "GitHub repository",
          parameters: [
            {
              in: "path",
              name: "username",
              required: true,
              schema: { type: "string" },
            },
            {
              in: "path",
              name: "repo",
              required: true,
              schema: { type: "string" },
            },
            {
              in: "query",
              name: "path",
              required: false,
              schema: { type: "string" },
            },
            {
              in: "query",
              name: "branch",
              required: false,
              schema: { type: "string" },
            },
            {
              in: "query",
              name: "commit",
              required: false,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description:
                "Repository metadata, root files, README, or selected file as HTML or Markdown.",
            },
            "404": { description: "Repository not found" },
          },
        },
      },
      "/llms.txt": {
        get: {
          summary: "LLM index",
          responses: { "200": { description: "Text LLM index" } },
        },
      },
      "/llms-full.txt": {
        get: {
          summary: "Full LLM context",
          responses: { "200": { description: "Text LLM context" } },
        },
      },
      "/.well-known/agent-skills/index.json": {
        get: {
          summary: "Agent Skills discovery index",
          responses: { "200": { description: "Agent Skills index" } },
        },
      },
    },
  })
}
