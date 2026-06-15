const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 1000 * 60 * 60 * 24 * 365],
  ["month", 1000 * 60 * 60 * 24 * 30],
  ["week", 1000 * 60 * 60 * 24 * 7],
  ["day", 1000 * 60 * 60 * 24],
  ["hour", 1000 * 60 * 60],
  ["minute", 1000 * 60],
]

export function formatShortRelativeDate(value: string, now = new Date()) {
  const date = new Date(value)
  const diff = date.getTime() - now.getTime()
  const absoluteDiff = Math.abs(diff)

  for (const [unit, unitMs] of RELATIVE_UNITS) {
    if (absoluteDiff >= unitMs) {
      const amount = Math.round(diff / unitMs)
      return new Intl.RelativeTimeFormat("en", { numeric: "always", style: "narrow" }).format(
        amount,
        unit
      )
    }
  }

  return "now"
}

export function buildRepositoryCreationAgeLabel(value: string, now = new Date()) {
  return `Created ${formatShortRelativeDate(value, now)}`
}

export function buildRepositoryIssueUrl(repositoryHtmlUrl: string) {
  return `${repositoryHtmlUrl.replace(/\/$/, "")}/issues/new`
}

export function buildRepositoryPullRequestUrl(repositoryHtmlUrl: string) {
  return `${repositoryHtmlUrl.replace(/\/$/, "")}/compare`
}
