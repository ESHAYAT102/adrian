import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  decodeSessionCookie,
  encodeSessionCookie,
  isAdminSessionUser,
  type SessionUser,
} from "@/lib/session"
import { assignAdmin } from "@/lib/admin"

const user: SessionUser = {
  accessToken: "gho_test_token",
  email: "octo@example.com",
  image: null,
  login: "octocat",
  name: "Octo Cat",
}

let dataDir: string

describe("session cookies", () => {
  const previousSecret = process.env.ADRIAN_SESSION_SECRET

  beforeEach(() => {
    process.env.ADRIAN_SESSION_SECRET = "test-secret"
    dataDir = mkdtempSync(join(tmpdir(), "adrian-session-"))
    process.env.ADRIAN_DATA_DIR = dataDir
  })

  afterEach(() => {
    process.env.ADRIAN_SESSION_SECRET = previousSecret
    rmSync(dataDir, { force: true, recursive: true })
    delete process.env.ADRIAN_DATA_DIR
  })

  it("round-trips a signed session cookie", () => {
    const cookie = encodeSessionCookie(user)

    expect(decodeSessionCookie(cookie)).toEqual(user)
  })

  it("encrypts the cookie payload instead of base64-encoding the access token", () => {
    const cookie = encodeSessionCookie(user)

    expect(cookie).toMatch(/^v2\./)
    expect(cookie).not.toContain(Buffer.from("gho_test_token", "utf8").toString("base64url"))
    expect(cookie).not.toContain(Buffer.from(user.login, "utf8").toString("base64url"))
  })

  it("rejects tampered encrypted cookies", () => {
    const cookie = encodeSessionCookie(user)
    const parts = cookie.split(".")
    const encrypted = parts[3]
    parts[3] = encrypted.replace(/.$/, encrypted.endsWith("a") ? "b" : "a")

    expect(decodeSessionCookie(parts.join("."))).toBeNull()
  })

  it("recognizes only the assigned admin user as admin", () => {
    assignAdmin("octocat")
    expect(isAdminSessionUser({ ...user, accessToken: "local:octocat", login: "octocat" }))
      .toBe(true)
    expect(isAdminSessionUser({ ...user, accessToken: "local:eshayat", login: "eshayat" }))
      .toBe(false)
    expect(isAdminSessionUser(null)).toBe(false)
  })
})
