"use client"

import {
  type PointerEvent,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  Building2,
  LinkIcon,
  MapPin,
} from "lucide-react"

import A from "@/components/A"
import type { Activity } from "@/components/contribution-graph"
import ProfileRepositories from "@/components/ProfileRepositories"
import { playUiSound } from "@/components/UiSoundEffects"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { GitHubProfile, GitHubRepository } from "@/lib/github"
import { cn } from "@/lib/utils"

type ProfileShowcaseProps = {
  contributions: Promise<Activity[]>
  profile: GitHubProfile
  repositories: GitHubRepository[]
  starredRepositories: GitHubRepository[]
}

const LANGUAGE_COLORS = [
  "bg-sky-500",
  "bg-yellow-400",
  "bg-violet-500",
  "bg-orange-500",
  "bg-lime-400",
  "bg-slate-400",
]

function formatJoinedDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(value))
}

function normalizeUrl(value: string) {
  return value.startsWith("http") ? value : `https://${value}`
}

function trimUrl(value: string) {
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "")
}

function ordinalSuffix(value: number) {
  const remainder = value % 100
  if (remainder >= 11 && remainder <= 13) return "th"

  switch (value % 10) {
    case 1:
      return "st"
    case 2:
      return "nd"
    case 3:
      return "rd"
    default:
      return "th"
  }
}

function formatContributionDate(value: string) {
  const [year = 0, month = 1, day = 1] = value.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  const monthLabel = new Intl.DateTimeFormat("en", {
    month: "short",
  }).format(date)

  return `${monthLabel} ${day}${ordinalSuffix(day)}, ${year}`
}

function buildLanguageDistribution(repositories: GitHubRepository[]) {
  const counts = new Map<string, number>()

  for (const repository of repositories) {
    if (!repository.language) continue
    counts.set(repository.language, (counts.get(repository.language) ?? 0) + 1)
  }

  const total = Array.from(counts.values()).reduce(
    (sum, value) => sum + value,
    0
  )

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([language, count], index) => ({
      colorClass: LANGUAGE_COLORS[index] ?? "bg-muted-foreground",
      count,
      language,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
}

function ContributionBackdrop({
  contributions,
}: {
  contributions: Activity[]
}) {
  const visibleDays = contributions.slice(0, 371)
  const lastHoverTarget = useRef<EventTarget | null>(null)
  const lastHoverAt = useRef(0)

  function handleContributionPointerOver(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return

    const cell = (event.target as Element | null)?.closest(
      "[data-contribution-cell]"
    )

    if (!cell || cell === lastHoverTarget.current) return

    const now = performance.now()
    if (now - lastHoverAt.current < 45) return

    lastHoverTarget.current = cell
    lastHoverAt.current = now
    playUiSound("hover")
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-80 overflow-hidden opacity-60">
      <div
        className="absolute inset-x-0 top-0 mx-auto grid w-460 grid-cols-[repeat(53,24px)] grid-rows-7 gap-2 px-10 pt-8 blur-[0.2px]"
        onPointerOver={handleContributionPointerOver}
      >
        <TooltipProvider>
          {visibleDays.map((activity) => (
            <Tooltip key={activity.date}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "pointer-events-auto size-6 rounded-[6px] ring-primary/70 transition outline-none hover:ring-2 focus-visible:ring-2",
                    activity.level === 0 && "bg-muted-foreground/4",
                    activity.level === 1 && "bg-muted-foreground/8",
                    activity.level === 2 && "bg-muted-foreground/[0.14]",
                    activity.level === 3 && "bg-muted-foreground/22",
                    activity.level >= 4 && "bg-muted-foreground/32"
                  )}
                  aria-label={`${activity.count} contributions on ${formatContributionDate(activity.date)}`}
                  data-contribution-cell
                  tabIndex={0}
                />
              </TooltipTrigger>
              <TooltipContent>
                <span className="font-semibold tabular-nums">
                  {activity.count.toLocaleString("en")} contribution
                  {activity.count === 1 ? "" : "s"}
                </span>{" "}
                on {formatContributionDate(activity.date)}
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-44 bg-linear-to-b from-transparent to-background" />
      <div className="absolute inset-y-0 left-0 w-56 bg-linear-to-r from-background to-transparent" />
      <div className="absolute inset-y-0 right-0 w-56 bg-linear-to-l from-background to-transparent" />
    </div>
  )
}

export default function ProfileShowcase({
  contributions,
  profile,
  repositories,
  starredRepositories,
}: ProfileShowcaseProps) {
  const contributionData = use(contributions)
  const [isAvatarOpen, setIsAvatarOpen] = useState(false)
  const fallbackInitial = profile.login.charAt(0).toUpperCase()
  const languageDistribution = useMemo(
    () => buildLanguageDistribution(repositories),
    [repositories]
  )
  const totalStars = useMemo(
    () => repositories.reduce((sum, r) => sum + (r.stargazers_count ?? 0), 0),
    [repositories]
  )

  useEffect(() => {
    if (!isAvatarOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAvatarOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isAvatarOpen])

  return (
    <section className="relative overflow-hidden px-4 pt-36 pb-8 md:px-8 lg:px-12">
      <ContributionBackdrop contributions={contributionData} />

      <div className="relative mx-auto max-w-5xl space-y-12">
        <div className="space-y-5">
          <button
            type="button"
            className="block rounded-full transition outline-none hover:scale-[1.015] focus-visible:ring-2 focus-visible:ring-ring active:scale-100"
            onClick={() => setIsAvatarOpen(true)}
            aria-label={`View ${profile.login}'s profile picture`}
          >
            <Avatar className="size-28 md:size-32">
              <AvatarImage
                src={profile.avatar_url ?? undefined}
                alt={profile.login}
              />
              <AvatarFallback className="text-4xl font-semibold">
                {fallbackInitial}
              </AvatarFallback>
            </Avatar>
          </button>

          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight">
                  {profile.name || profile.login}
                </h1>
              </div>
              <p className="mt-1 text-base text-muted-foreground">
                @{profile.login}
                <span className="mx-2 text-border">·</span>
                Joined {formatJoinedDate(profile.created_at)}
              </p>
            </div>

            {profile.bio ? (
              <p className="max-w-2xl text-base leading-7 text-foreground">
                {profile.bio}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted-foreground">
              {profile.company ? (
                <span className="inline-flex items-center gap-2">
                  <Building2 className="size-4" />
                  {profile.company}
                </span>
              ) : null}
              {profile.location ? (
                <span className="inline-flex items-center gap-2">
                  <MapPin className="size-4" />
                  {profile.location}
                </span>
              ) : null}
              {profile.blog ? (
                <A
                  href={normalizeUrl(profile.blog)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 hover:text-foreground"
                >
                  <LinkIcon className="size-4" />
                  {trimUrl(profile.blog)}
                </A>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-base text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <strong className="font-semibold text-foreground">
                  {repositories.length.toLocaleString("en")}
                </strong>
                {repositories.length === 1 ? "repository" : "repositories"}
              </span>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1.5">
                <strong className="font-semibold text-foreground">
                  {totalStars.toLocaleString("en")}
                </strong>
                {totalStars === 1 ? "star" : "total stars"}
              </span>
            </div>
          </div>
        </div>

        {languageDistribution.length > 0 ? (
          <div className="max-w-3xl space-y-3">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
              {languageDistribution.map((language) => (
                <div
                  key={language.language}
                  className={language.colorClass}
                  style={{ width: `${language.percentage}%` }}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
              {languageDistribution.map((language) => (
                <div
                  key={language.language}
                  className="flex items-center gap-2"
                >
                  <span
                    className={cn("size-2 rounded-full", language.colorClass)}
                  />
                  <span>
                    {language.language} {language.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          <h2 className="text-base font-medium text-muted-foreground">
            Repositories
          </h2>
          <ProfileRepositories
            compact
            repositories={repositories}
            starredRepositories={starredRepositories}
          />
        </div>
      </div>

      {isAvatarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-50 flex cursor-default items-center justify-center bg-background/50 p-8 backdrop-blur-sm"
          onClick={() => setIsAvatarOpen(false)}
          aria-label="Close profile picture preview"
        >
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,transparent_18rem,var(--background)_42rem)] opacity-80" />
          <Avatar className="relative size-64 ring-1 ring-border md:size-88">
            <AvatarImage
              src={profile.avatar_url ?? undefined}
              alt={profile.login}
            />
            <AvatarFallback className="text-7xl font-semibold">
              {fallbackInitial}
            </AvatarFallback>
          </Avatar>
        </button>
      ) : null}
    </section>
  )
}

export function ProfileShowcaseFallback() {
  return (
    <section className="overflow-hidden px-4 pt-36 pb-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl animate-pulse space-y-8">
        <div className="size-28 rounded-full bg-muted md:size-32" />
        <div className="space-y-3">
          <div className="h-8 w-64 rounded bg-muted" />
          <div className="h-5 w-96 max-w-full rounded bg-muted" />
          <div className="h-5 w-80 max-w-full rounded bg-muted" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-24 rounded-2xl bg-muted/50" />
          ))}
        </div>
      </div>
    </section>
  )
}
