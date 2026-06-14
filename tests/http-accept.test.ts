import { describe, expect, it } from "vitest"

import { chooseRepresentation, parseAcceptHeader } from "@/lib/http-accept"

describe("HTTP Accept negotiation", () => {
  it("prefers markdown when it has the highest q value", () => {
    expect(
      chooseRepresentation("text/html;q=0.5, text/markdown;q=1.0")
    ).toBe("text/markdown")
  })

  it("falls back to html for wildcard accepts", () => {
    expect(chooseRepresentation("*/*")).toBe("text/html")
  })

  it("returns null when no supported representation is acceptable", () => {
    expect(chooseRepresentation("application/json")).toBeNull()
  })

  it("sorts by q, specificity, and original order", () => {
    expect(parseAcceptHeader("text/*;q=0.8, text/markdown;q=0.8")[0]).toMatchObject({
      mediaType: "text/markdown",
      q: 0.8,
      specificity: 2,
    })
  })
})
