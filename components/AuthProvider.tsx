"use client"

import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react"

import type { SessionUser } from "@/lib/session"

type AuthContextValue = {
  isAdmin: boolean
  isAuthenticated: boolean
  user: SessionUser | null
}

const AuthContext = createContext<AuthContextValue>({
  isAdmin: false,
  isAuthenticated: false,
  user: null,
})

type AuthProviderProps = PropsWithChildren<{
  isAdmin: boolean
  user: SessionUser | null
}>

export default function AuthProvider({ children, isAdmin, user }: AuthProviderProps) {
  const value = useMemo(
    () => ({
      isAdmin,
      isAuthenticated: Boolean(user),
      user,
    }),
    [isAdmin, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
