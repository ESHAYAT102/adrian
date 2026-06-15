import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  decodeSessionCookie,
  encodeSessionCookie,
  isAdminSessionUser,
  type SessionUser,
} from "@/lib/session"

const user: SessionUser = {
  accessToken: "gho_test_token",
  email: "octo@example.com",
  image: null,
  login: "octocat",
  name: "Octo Cat",
}

describe("session cookies", () => {
  const previousSecret = process.env.NEXTAUTH_SECRET

  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = "test-secret"
  })

  afterEach(() => {
    process.env.NEXTAUTH_SECRET = previousSecret
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

  it("recognizes only the hardcoded admin session as admin", () => {
    expect(isAdminSessionUser({ ...user, accessToken: "local:admin", login: "admin" }))
      .toBe(true)
    expect(isAdminSessionUser({ ...user, accessToken: "local:eshayat", login: "eshayat" }))
      .toBe(false)
    expect(isAdminSessionUser(null)).toBe(false)
  })
})
