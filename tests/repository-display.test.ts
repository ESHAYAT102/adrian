import { describe, expect, it } from "vitest"

import {
  buildRepositoryCreationAgeLabel,
  buildRepositoryIssueUrl,
  buildRepositoryPullRequestUrl,
} from "@/lib/repository-display"

describe("repository display helpers", () => {
  it("builds issue and pull request creation URLs", () => {
    expect(buildRepositoryIssueUrl("/eshayat/test")).toBe("/eshayat/test/issues/new")
    expect(buildRepositoryPullRequestUrl("/eshayat/test")).toBe("/eshayat/test/compare")
  })

  it("shows repository age beside the updated time", () => {
    expect(
      buildRepositoryCreationAgeLabel("2025-06-15T07:00:00.000Z", new Date("2026-06-15T07:00:00.000Z"))
    ).toBe("Created 1y ago")
  })
})
