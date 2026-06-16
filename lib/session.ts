import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { cookies } from "next/headers"

import { getAdminUsername } from "@/lib/admin-store"
import { isAdminUser } from "@/lib/admin"

export type SessionUser = {
  accessToken: string
  email: string | null
  image: string | null
  login: string
  name: string | null
}

type SessionPayload = {
  user: SessionUser
}

type OAuthStatePayload = {
  callbackUrl: string
  state: string
}

export const SESSION_COOKIE_NAME = "Adrian_session"
export const OAUTH_STATE_COOKIE_NAME = "Adrian_oauth_state"

const SESSION_MAX_AGE = 60 * 60 * 24 * 30
const OAUTH_STATE_MAX_AGE = 60 * 10
const SESSION_COOKIE_VERSION = "v2"
const SESSION_IV_BYTES = 12
const SESSION_AUTH_TAG_BYTES = 16

function getEnvFilePath() {
  return join(process.cwd(), ".env")
}

function readSecretFromEnvFile() {
  const envPath = getEnvFilePath()
  if (!existsSync(envPath)) return null

  const content = readFileSync(envPath, "utf8")
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (trimmed.startsWith("ADRIAN_SESSION_SECRET=")) {
      const value = trimmed.slice("ADRIAN_SESSION_SECRET=".length).replace(/^["']|["']$/g, "")
      if (value) return value
    }
  }
  return null
}

function writeSecretToEnvFile(secret: string) {
  if (process.env.NODE_ENV === "test") return
  const envPath = getEnvFilePath()
  const line = `ADRIAN_SESSION_SECRET=${secret}\n`

  if (!existsSync(envPath)) {
    writeFileSync(envPath, line)
    return
  }

  const content = readFileSync(envPath, "utf8")
  const lines = content.split("\n")
  let replaced = false

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith("ADRIAN_SESSION_SECRET=")) {
      lines[i] = line.trim()
      replaced = true
      break
    }
  }

  if (!replaced) {
    lines.push(line.trim())
  }

  writeFileSync(envPath, lines.join("\n") + "\n")
}

function getSessionSecret() {
  if (process.env.ADRIAN_SESSION_SECRET) {
    return process.env.ADRIAN_SESSION_SECRET
  }

  const fromFile = readSecretFromEnvFile()
  if (fromFile) {
    process.env.ADRIAN_SESSION_SECRET = fromFile
    return fromFile
  }

  const generated = randomBytes(32).toString("hex")
  process.env.ADRIAN_SESSION_SECRET = generated
  writeSecretToEnvFile(generated)
  return generated
}

function getSessionEncryptionKey() {
  return createHash("sha256").update(getSessionSecret()).digest()
}

function encodeBase64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url")
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8")
}

function encryptSessionPayload(payload: SessionPayload) {
  const iv = randomBytes(SESSION_IV_BYTES)
  const cipher = createCipheriv("aes-256-gcm", getSessionEncryptionKey(), iv, {
    authTagLength: SESSION_AUTH_TAG_BYTES,
  })
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  return [
    SESSION_COOKIE_VERSION,
    encodeBase64Url(iv),
    encodeBase64Url(authTag),
    encodeBase64Url(encrypted),
  ].join(".")
}

function decryptSessionPayload(cookieValue: string) {
  const [version, encodedIv, encodedAuthTag, encodedEncrypted] =
    cookieValue.split(".")

  if (
    version !== SESSION_COOKIE_VERSION ||
    !encodedIv ||
    !encodedAuthTag ||
    !encodedEncrypted
  ) {
    return null
  }

  const iv = Buffer.from(encodedIv, "base64url")
  const authTag = Buffer.from(encodedAuthTag, "base64url")
  const encrypted = Buffer.from(encodedEncrypted, "base64url")

  const decipher = createDecipheriv("aes-256-gcm", getSessionEncryptionKey(), iv, {
    authTagLength: SESSION_AUTH_TAG_BYTES,
  })
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8")

  return JSON.parse(decrypted) as SessionPayload
}

export function encodeSessionCookie(user: SessionUser) {
  return encryptSessionPayload({ user })
}

export function createSessionCookie(user: SessionUser) {
  return encryptSessionPayload({ user })
}

export function decodeSessionCookie(cookieValue?: string | null) {
  if (!cookieValue) return null

  try {
    return decryptSessionPayload(cookieValue)?.user ?? null
  } catch {
    return null
  }
}

export function isAdminSessionUser(user?: SessionUser | null) {
  const adminUsername = getAdminUsername()
  return isAdminUser(user, adminUsername)
}

export async function getSessionUser() {
  const cookieStore = await cookies()
  return decodeSessionCookie(cookieStore.get(SESSION_COOKIE_NAME)?.value)
}

export function createOAuthState(callbackUrl: string) {
  const payload: OAuthStatePayload = {
    callbackUrl,
    state: randomBytes(16).toString("hex"),
  }

  return {
    cookieValue: encodeBase64Url(JSON.stringify(payload)),
    state: payload.state,
  }
}

export function decodeOAuthState(cookieValue?: string | null) {
  if (!cookieValue) return null

  try {
    return JSON.parse(decodeBase64Url(cookieValue)) as OAuthStatePayload
  } catch {
    return null
  }
}

export function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure:
      process.env.ADRIAN_COOKIE_SECURE === "true" ||
      (process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") ?? false),
  }
}

export const sessionCookieOptions = getCookieOptions(SESSION_MAX_AGE)
export const oauthStateCookieOptions = getCookieOptions(OAUTH_STATE_MAX_AGE)
