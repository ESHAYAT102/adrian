import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

describe("global text selection styles", () => {
  const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8")

  it("defines theme-aware selection color variables", () => {
    expect(css).toContain("--selection-background: color-mix")
    expect(css).toContain("--selection-foreground: var(--primary-foreground)")
  })

  it("enables text selection globally while keeping controls unselectable", () => {
    expect(css).toContain("user-select: text")
    expect(css).toContain("button,")
    expect(css).toContain("user-select: none")
  })

  it("styles browser text selections from theme variables", () => {
    expect(css).toContain("::selection")
    expect(css).toContain("background: var(--selection-background)")
    expect(css).toContain("color: var(--selection-foreground)")
  })
})
