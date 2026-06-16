import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { getDataDir } from "@/lib/local-git"

export type AdminUserLike = {
  accessToken?: string | null
  login?: string | null
}

function getAdminPath() {
  const dir = getDataDir()
  mkdirSync(dir, { recursive: true })
  return join(dir, "admin.json")
}

export function getAdminUsername() {
  const path = getAdminPath()
  if (!existsSync(path)) return null
  try {
    const data = JSON.parse(readFileSync(path, "utf8")) as { username: string }
    return data.username ?? null
  } catch {
    return null
  }
}

export function isAdminAssigned() {
  return getAdminUsername() !== null
}

export function assignAdmin(username: string) {
  const path = getAdminPath()
  writeFileSync(path, `${JSON.stringify({ username }, null, 2)}\n`)
}

export function isAdminUser(user?: AdminUserLike | null) {
  if (!user?.login) return false
  const admin = getAdminUsername()
  return admin === user.login
}
