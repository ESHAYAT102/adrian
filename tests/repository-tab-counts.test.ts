import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

describe("repository tab counts", () => {
  it("loads commit count for every repository tab", () => {
    const page = readFileSync(join(process.cwd(), "app/[username]/[repo]/page.tsx"), "utf8")

    expect(page).toContain("const [commitsResult, countResult]")
    expect(page).not.toContain('currentTab === "code" || currentTab === "commits"')
    expect(page).not.toContain('currentTab === "commits")')
  })
})
