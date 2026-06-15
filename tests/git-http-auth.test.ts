import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { authenticateGitRequest, basicAuthChallenge } from "@/app/[username]/[repo]/[...path]/route"
import { createLocalUser } from "@/lib/local-users"

let dataDir: string

function basic(username: string, password: string) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`
}

beforeEach(() => {
  dataDir = mkdtempSync(join(tmpdir(), "adrian-git-auth-"))
  process.env.ADRIAN_DATA_DIR = dataDir
})

afterEach(() => {
  rmSync(dataDir, { force: true, recursive: true })
  delete process.env.ADRIAN_DATA_DIR
})

describe("Git HTTP basic authentication", () => {
  it("challenges anonymous git smart HTTP requests", () => {
    const request = new Request("http://localhost/eshayat/repo.git/info/refs?service=git-receive-pack")

    expect(authenticateGitRequest(request, "eshayat")).toBeNull()
    expect(basicAuthChallenge().status).toBe(401)
    expect(basicAuthChallenge().headers.get("WWW-Authenticate")).toContain("Basic")
  })

  it("accepts the repository owner's account password", () => {
    createLocalUser({ username: "eshayat", password: "correct horse battery staple" })
    const request = new Request("http://localhost/eshayat/repo.git/info/refs?service=git-receive-pack", {
      headers: { Authorization: basic("eshayat", "correct horse battery staple") },
    })

    expect(authenticateGitRequest(request, "eshayat")?.username).toBe("eshayat")
  })

  it("rejects wrong passwords and users who do not own the repository", () => {
    createLocalUser({ username: "eshayat", password: "correct horse battery staple" })
    createLocalUser({ username: "alice", password: "correct horse battery staple" })

    expect(
      authenticateGitRequest(
        new Request("http://localhost/eshayat/repo.git/git-receive-pack", {
          headers: { Authorization: basic("eshayat", "wrong password") },
        }),
        "eshayat"
      )
    ).toBeNull()
    expect(
      authenticateGitRequest(
        new Request("http://localhost/eshayat/repo.git/git-receive-pack", {
          headers: { Authorization: basic("alice", "correct horse battery staple") },
        }),
        "eshayat"
      )
    ).toBeNull()
  })
})
