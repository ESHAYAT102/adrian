export type AdminUserLike = {
  login?: string | null
}

export function isAdminUser(
  user?: AdminUserLike | null,
  adminUsername?: string | null
) {
  if (!user?.login || !adminUsername) return false
  return user.login === adminUsername
}
