import type { Metadata } from "next"

import BrowserContextMenu from "@/components/BrowserContextMenu"
import Navbar from "@/components/Navbar"
import NewRepositoryForm from "@/components/NewRepositoryForm"
import { LoginForm } from "@/components/login-form"
import { getGitHubNotifications, getGitHubViewerSettings } from "@/lib/github"
import { getSessionUser, isAdminSessionUser } from "@/lib/session"

export async function generateMetadata(): Promise<Metadata> {
  return { title: "New Repository" }
}

export default async function NewRepositoryPage() {
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

  if (isAdminSessionUser(sessionUser)) {
    return (
      <BrowserContextMenu triggerClassName="block min-h-screen w-full">
        <div className="min-h-screen bg-background text-foreground">
          <Navbar initialUnreadNotifications={unreadNotifications} />
          <main className="mx-auto max-w-4xl px-5 pt-24 pb-10">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h1 className="text-2xl font-semibold tracking-tight">
                Admins cannot create repositories
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                The admin account manages users and repositories created by normal accounts.
              </p>
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
        <main className="mx-auto max-w-6xl px-5 pt-24 pb-10">
          <div className="grid grid-cols-1 gap-6">
            <section>
              <NewRepositoryForm canCreateRepositories={true} />
            </section>
          </div>
        </main>
      </div>
    </BrowserContextMenu>
  )
}
