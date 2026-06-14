import { describe, expect, it } from "vitest"

import { buildRequestedGitHubUrl, encodeGitHubPath } from "@/lib/github-urls"

describe("GitHub URL helpers", () => {
  it("encodes nested file paths without preserving empty segments", () => {
    expect(encodeGitHubPath("src//app/page test.tsx")).toBe("src/app/page%20test.tsx")
  })

  it("builds a blob URL for selected files using branch refs", () => {
    expect(
      buildRequestedGitHubUrl({
        branch: "feature/raycast mode",
        path: "src/app/page.tsx",
        repo: "xenon",
        username: "ESHAYAT102",
      })
    ).toBe(
      "https://github.com/ESHAYAT102/xenon/blob/feature%2Fraycast%20mode/src/app/page.tsx"
    )
  })

  it("builds issue, pull request, and tab URLs", () => {
    expect(
      buildRequestedGitHubUrl({ issue: "42", repo: "xenon", username: "ESHAYAT102" })
    ).toBe("https://github.com/ESHAYAT102/xenon/issues/42")
    expect(
      buildRequestedGitHubUrl({ pr: "7", repo: "xenon", username: "ESHAYAT102" })
    ).toBe("https://github.com/ESHAYAT102/xenon/pull/7")
    expect(
      buildRequestedGitHubUrl({ repo: "xenon", tab: "releases", username: "ESHAYAT102" })
    ).toBe("https://github.com/ESHAYAT102/xenon/releases")
  })
})
