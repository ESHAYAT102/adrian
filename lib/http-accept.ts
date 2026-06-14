export type AcceptedType = {
  mediaType: string
  order: number
  q: number
  specificity: number
}

export const NEGOTIABLE_TYPES = ["text/html", "text/markdown"] as const
export type NegotiableType = (typeof NEGOTIABLE_TYPES)[number]

export function parseAcceptHeader(value: string | null): AcceptedType[] {
  if (!value) {
    return [{ mediaType: "*/*", order: 0, q: 1, specificity: 0 }]
  }

  return value
    .split(",")
    .map((part, order) => {
      const [mediaRange, ...parameters] = part.trim().split(";")
      const qParameter = parameters.find((parameter) =>
        parameter.trim().startsWith("q=")
      )
      const q = qParameter ? Number(qParameter.trim().slice(2)) : 1
      const mediaType = mediaRange.trim().toLowerCase()
      const specificity =
        mediaType === "*/*" ? 0 : mediaType.endsWith("/*") ? 1 : 2

      return {
        mediaType,
        order,
        q: Number.isFinite(q) ? q : 0,
        specificity,
      }
    })
    .filter((item) => item.q > 0)
    .sort(
      (a, b) => b.q - a.q || b.specificity - a.specificity || a.order - b.order
    )
}

export function mediaRangeMatches(range: string, mediaType: string) {
  if (range === "*/*") return true
  if (range === mediaType) return true

  const [rangeType, rangeSubtype] = range.split("/")
  const [type] = mediaType.split("/")

  return rangeSubtype === "*" && rangeType === type
}

export function chooseRepresentation(accept: string | null) {
  const accepted = parseAcceptHeader(accept)

  for (const item of accepted) {
    const match = NEGOTIABLE_TYPES.find((mediaType) =>
      mediaRangeMatches(item.mediaType, mediaType)
    )

    if (match) return match
  }

  return null
}
