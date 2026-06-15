"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { GitHubViewerSettings } from "@/lib/github"

type SettingsFormProps = {
  settings: GitHubViewerSettings
}

export default function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter()
  const [formState, setFormState] = useState({
    bio: settings.bio ?? "",
    blog: settings.blog ?? "",
    company: settings.company ?? "",
    email: settings.email ?? "",
    hireable: settings.hireable ?? false,
    location: settings.location ?? "",
    name: settings.name ?? "",
    twitterUsername: settings.twitterUsername ?? "",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(settings.avatarUrl)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canEdit = settings.canEditProfile

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      toast.error("Choose an image first")
      return
    }

    setIsUploadingAvatar(true)
    setError(null)
    setNotice(null)

    const formData = new FormData()
    formData.set("avatar", avatarFile)

    try {
      const response = await fetch("/api/settings/avatar", {
        body: formData,
        method: "POST",
      })
      const data = (await response.json().catch(() => ({}))) as {
        avatarUrl?: string
        error?: string
      }

      if (!response.ok || !data.avatarUrl) {
        const message =
          data.error === "unsupported_image_type"
            ? "Please upload a PNG, JPEG, GIF, or WebP image."
            : data.error === "image_too_large"
              ? "Profile pictures must be 2 MB or smaller."
              : "Could not upload profile picture."
        setError(message)
        toast.error(message)
        return
      }

      setAvatarPreviewUrl(data.avatarUrl)
      setAvatarFile(null)
      setNotice("Profile picture updated.")
      toast.success("Profile picture updated")
      router.refresh()
    } catch {
      const message = "Could not upload profile picture."
      setError(message)
      toast.error(message)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setNotice(null)

    const response = await fetch("/api/settings", {
      body: JSON.stringify({
        bio: formState.bio || null,
        blog: formState.blog || null,
        company: formState.company || null,
        email: formState.email || null,
        hireable: formState.hireable,
        location: formState.location || null,
        name: formState.name || null,
        twitter_username: formState.twitterUsername || null,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    })

    const data = (await response.json()) as {
      error?: string
      settings?: GitHubViewerSettings
    }

    setIsSaving(false)

    if (!response.ok) {
      setError(
        data.error === "forbidden"
          ? "Your current Adrian session cannot edit profile settings yet."
          : data.error === "validation_failed"
            ? "Adrian rejected one of the values. Check the fields and try again."
            : "Saving failed. Please try again."
      )
      return
    }

    if (data.settings) {
      setFormState({
        bio: data.settings.bio ?? "",
        blog: data.settings.blog ?? "",
        company: data.settings.company ?? "",
        email: data.settings.email ?? "",
        hireable: data.settings.hireable ?? false,
        location: data.settings.location ?? "",
        name: data.settings.name ?? "",
        twitterUsername: data.settings.twitterUsername ?? "",
      })
    }

    setNotice("Settings saved to Adrian.")
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Delete your Adrian account? This signs you out and removes your local account login."
    )
    if (!confirmed) return

    setIsDeletingAccount(true)
    setError(null)
    setNotice(null)

    try {
      const response = await fetch("/api/settings/account", { method: "DELETE" })
      if (!response.ok) {
        const message = "Could not delete account. Please try again."
        setError(message)
        toast.error(message)
        return
      }
      toast.success("Account deleted")
      router.replace("/")
      router.refresh()
    } catch {
      const message = "Could not delete account. Please try again."
      setError(message)
      toast.error(message)
    } finally {
      setIsDeletingAccount(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            These fields sync with your Adrian profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel>Profile picture</FieldLabel>
              <FieldContent>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div
                    className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted bg-cover bg-center text-2xl font-semibold text-muted-foreground"
                    style={
                      avatarPreviewUrl
                        ? { backgroundImage: `url(${avatarPreviewUrl})` }
                        : undefined
                    }
                    aria-label="Current profile picture"
                  >
                    {avatarPreviewUrl ? null : settings.login.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-1 flex-col gap-3">
                    <Input
                      disabled={!canEdit || isUploadingAvatar}
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null
                        setAvatarFile(file)
                        if (file) {
                          setAvatarPreviewUrl(URL.createObjectURL(file))
                        } else {
                          setAvatarPreviewUrl(settings.avatarUrl)
                        }
                      }}
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        className="rounded-xl"
                        disabled={!canEdit || !avatarFile || isUploadingAvatar}
                        onClick={handleAvatarUpload}
                        type="button"
                        variant="outline"
                      >
                        {isUploadingAvatar ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Upload />
                        )}
                        Upload picture
                      </Button>
                      <FieldDescription>
                        PNG, JPEG, GIF, or WebP. Max 2 MB.
                      </FieldDescription>
                    </div>
                  </div>
                </div>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Name</FieldLabel>
              <FieldContent>
                <Input
                  disabled={!canEdit}
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Bio</FieldLabel>
              <FieldContent>
                <Textarea
                  disabled={!canEdit}
                  value={formState.bio}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      bio: event.target.value,
                    }))
                  }
                />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel>Website</FieldLabel>
                <Input
                  disabled={!canEdit}
                  value={formState.blog}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      blog: event.target.value,
                    }))
                  }
                />
              </FieldContent>
              <FieldContent>
                <FieldLabel>Company</FieldLabel>
                <Input
                  disabled={!canEdit}
                  value={formState.company}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      company: event.target.value,
                    }))
                  }
                />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel>Location</FieldLabel>
                <Input
                  disabled={!canEdit}
                  value={formState.location}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                />
              </FieldContent>
              <FieldContent>
                <FieldLabel>Twitter Username</FieldLabel>
                <Input
                  disabled={!canEdit}
                  value={formState.twitterUsername}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      twitterUsername: event.target.value,
                    }))
                  }
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Email</FieldLabel>
              <FieldContent>
                <Input
                  disabled={!canEdit}
                  type="email"
                  value={formState.email}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
                <FieldDescription>
                  Used for your local Adrian account and session profile.
                </FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {notice ? <p className="text-sm text-emerald-500">{notice}</p> : null}

          <div className="flex justify-end">
            <Button
              className="rounded-xl"
              disabled={!canEdit || isSaving}
              onClick={handleSave}
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Delete account</CardTitle>
          <CardDescription>
            Permanently remove your local Adrian account login and sign out of this browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="rounded-xl"
            disabled={isDeletingAccount}
            onClick={handleDeleteAccount}
            type="button"
            variant="destructive"
          >
            {isDeletingAccount ? <Loader2 className="animate-spin" /> : <Trash2 />}
            Delete account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
