import { NextResponse } from "next/server"

import {
  getGitHubNotifications,
  markGitHubNotificationAsDone,
  markGitHubNotificationAsRead,
  unsubscribeFromGitHubNotification,
} from "@/lib/github"
import { getSessionUser } from "@/lib/session"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const unreadOnly = searchParams.get("unreadOnly") !== "false"
  const sessionUser = await getSessionUser()

  if (!sessionUser) {
    return NextResponse.json({ notifications: [] })
  }

  const notifications = await getGitHubNotifications(sessionUser, {
    unreadOnly,
  })

  return NextResponse.json({ notifications })
}

export async function PATCH(request: Request) {
  const { threadId } = (await request.json()) as { threadId: string }
  const sessionUser = await getSessionUser()
  const result = await markGitHubNotificationAsRead(sessionUser, threadId)
  return NextResponse.json(result, { status: result.status })
}

export async function DELETE(request: Request) {
  const { threadId } = (await request.json()) as { threadId: string }
  const sessionUser = await getSessionUser()
  const result = await markGitHubNotificationAsDone(sessionUser, threadId)
  return NextResponse.json(result, { status: result.status })
}

export async function PUT(request: Request) {
  const { threadId } = (await request.json()) as { threadId: string }
  const sessionUser = await getSessionUser()
  const result = await unsubscribeFromGitHubNotification(sessionUser, threadId)
  return NextResponse.json(result, { status: result.status })
}
