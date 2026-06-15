import type { Metadata } from "next"

import BrowserContextMenu from "@/components/BrowserContextMenu"
import Navbar from "@/components/Navbar"
import SettingsForm from "@/components/SettingsForm"
import { LoginForm } from "@/components/login-form"
import { getGitHubNotifications, getGitHubViewerSettings } from "@/lib/github"
import { getSessionUser } from "@/lib/session"

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Settings" }
}

export default async function SettingsPage() {
  const sessionUser = await getSessionUser()
  const unreadNotifications = await getGitHubNotifications(sessionUser, {
    unreadOnly: true,
  })
  const settings = await getGitHubViewerSettings(sessionUser)

  if (!sessionUser || !settings) {
    return (
      <BrowserContextMenu triggerClassName="block min-h-screen w-full">
        <div className="min-h-screen bg-background text-foreground">
          <Navbar initialUnreadNotifications={[]} />
          <main className="mx-auto max-w-5xl px-5 pt-24 pb-10">
            <div className="flex min-h-[60vh] items-center justify-center">
              <LoginForm />
            </div>
          </main>
        </div>
      </BrowserContextMenu>
    )
  }

  return (
    <BrowserContextMenu triggerClassName="block min-h-screen w-full">
      <div className="min-h-screen bg-background text-foreground">
        <Navbar initialUnreadNotifications={unreadNotifications} />
        <main className="mx-auto max-w-4xl px-5 pt-24 pb-10">
          <div className="mb-8 space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your local Adrian account details.
            </p>
          </div>

          <SettingsForm settings={settings} />
        </main>
      </div>
    </BrowserContextMenu>
  )
}
