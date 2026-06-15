export const BUILTIN_ADMIN_USERNAME = "admin"
export const BUILTIN_ADMIN_PASSWORD = "admin@123"

export type AdminUserLike = {
  accessToken?: string | null
  login?: string | null
}

export function isAdminUser(user?: AdminUserLike | null) {
  return user?.login === BUILTIN_ADMIN_USERNAME && user.accessToken === "local:admin"
}
