import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

describe("navbar logo context menu", () => {
  it("opens the Adrian GitHub repository from Open repository", () => {
    const navbar = readFileSync(join(process.cwd(), "components/Navbar.tsx"), "utf8")

    expect(navbar).toContain("https://github.com/ESHAYAT102/adrian/")
    expect(navbar).toContain("Open repository")
  })
})
