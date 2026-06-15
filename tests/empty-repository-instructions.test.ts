import { describe, expect, it } from "vitest"

import { buildEmptyRepositoryCommands } from "@/components/EmptyRepositoryInstructions"

describe("empty repository instructions", () => {
  it("uses the hosted Git clone URL in the origin line", () => {
    const commands = buildEmptyRepositoryCommands("https://adrian.example.test/eshayat/repo.git")

    expect(commands).toContain(
      "git remote add origin https://adrian.example.test/eshayat/repo.git"
    )
    expect(commands).not.toContain("git remote add origin /eshayat/repo.git")
  })

  it("spells initial commit correctly", () => {
    expect(buildEmptyRepositoryCommands("https://adrian.example.test/eshayat/repo.git")).toContain(
      'git commit -m "initial commit"'
    )
  })
})
