import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { getDataDir, normalizeOwner } from "@/lib/local-git"
import { getLocalUserByUsername } from "@/lib/local-users"
import type { GitHubNotification } from "@/lib/github"

function getNotificationsDir() {
  return join(getDataDir(), "notifications")
}

function getUserNotificationsPath(username: string) {
  return join(getNotificationsDir(), normalizeOwner(username), "notifications.json")
}

function readUserNotifications(username: string): GitHubNotification[] {
  const path = getUserNotificationsPath(username)
  if (!existsSync(path)) return []
  return JSON.parse(readFileSync(path, "utf8")) as GitHubNotification[]
}

function writeUserNotifications(username: string, notifications: GitHubNotification[]) {
  const dir = join(getNotificationsDir(), normalizeOwner(username))
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    getUserNotificationsPath(username),
    `${JSON.stringify(notifications, null, 2)}\n`,
  )
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function addNotification(
  receiverUsername: string,
  notification: {
    reason: string
    repositoryFullName: string
    repositoryUrl: string
    subjectTitle: string
    subjectType: string
    url: string
  },
) {
  const normalized = normalizeOwner(receiverUsername)
  if (!getLocalUserByUsername(normalized)) return

  const existing = readUserNotifications(normalized)
  const entry: GitHubNotification = {
    id: generateId(),
    reason: notification.reason,
    repositoryFullName: notification.repositoryFullName,
    repositoryUrl: notification.repositoryUrl,
    subjectTitle: notification.subjectTitle,
    subjectType: notification.subjectType,
    unread: true,
    updatedAt: new Date().toISOString(),
    url: notification.url,
  }
  writeUserNotifications(normalized, [entry, ...existing])
}

export function getUserNotifications(
  username: string,
  unreadOnly?: boolean,
): GitHubNotification[] {
  const normalized = normalizeOwner(username)
  const all = readUserNotifications(normalized)
  if (unreadOnly) return all.filter((n) => n.unread)
  return all
}

export function markNotificationAsRead(username: string, threadId: string) {
  const normalized = normalizeOwner(username)
  const all = readUserNotifications(normalized)
  writeUserNotifications(
    normalized,
    all.map((n) => (n.id === threadId ? { ...n, unread: false } : n)),
  )
  return { ok: true, status: 200 }
}

export function removeNotification(username: string | null | undefined, threadId?: string) {
  if (!username || !threadId) return { ok: true, status: 200 }
  const normalized = normalizeOwner(username)
  const all = readUserNotifications(normalized)
  writeUserNotifications(
    normalized,
    all.filter((n) => n.id !== threadId),
  )
  return { ok: true, status: 200 }
}
