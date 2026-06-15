import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  createLocalRepository,
  isLocalRepositoryStarredByUser,
  starLocalRepositoryForUser,
  unstarLocalRepositoryForUser,
} from "@/lib/local-git"
import {
  getGitHubRepository,
  isGitHubRepositoryStarred,
  starGitHubRepository,
  unstarGitHubRepository,
} from "@/lib/github"
import type { SessionUser } from "@/lib/session"

let dataDir: string

const user: SessionUser = {
  accessToken: "local",
  email: null,
  image: null,
  login: "eshayat",
  name: "Eshayat",
}

beforeEach(() => {
  dataDir = mkdtempSync(join(tmpdir(), "adrian-stars-"))
  process.env.ADRIAN_DATA_DIR = dataDir
  createLocalRepository({ name: "demo", owner: "eshayat" })
})

afterEach(() => {
  rmSync(dataDir, { force: true, recursive: true })
  delete process.env.ADRIAN_DATA_DIR
})

describe("repository stars", () => {
  it("persists stars per user in local repository metadata", async () => {
    expect(isLocalRepositoryStarredByUser("eshayat", "demo", "eshayat")).toBe(false)

    starLocalRepositoryForUser("eshayat", "demo", "eshayat")

    expect(isLocalRepositoryStarredByUser("eshayat", "demo", "eshayat")).toBe(true)
    await expect(getGitHubRepository("eshayat", "demo", user)).resolves.toMatchObject({
      repository: { stargazers_count: 1 },
    })

    unstarLocalRepositoryForUser("eshayat", "demo", "eshayat")

    expect(isLocalRepositoryStarredByUser("eshayat", "demo", "eshayat")).toBe(false)
  })

  it("keeps GitHub-compatible star APIs persistent across reloads", async () => {
    expect(await isGitHubRepositoryStarred(user, "eshayat", "demo")).toBe(false)

    await starGitHubRepository(user, "eshayat", "demo")

    expect(await isGitHubRepositoryStarred(user, "eshayat", "demo")).toBe(true)
    expect((await getGitHubRepository("eshayat", "demo", user)).repository).toMatchObject({
      stargazers_count: 1,
    })

    await unstarGitHubRepository(user, "eshayat", "demo")

    expect(await isGitHubRepositoryStarred(user, "eshayat", "demo")).toBe(false)
  })
})
