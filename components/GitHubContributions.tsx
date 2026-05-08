"use client"

import { use } from "react"

import {
  ContributionGraph,
  ContributionGraphBlock,
  ContributionGraphCalendar,
  ContributionGraphFooter,
  ContributionGraphLegend,
  ContributionGraphTotalCount,
  type Activity,
} from "@/components/contribution-graph"
import Loader from "@/components/Loader"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

function formatTooltipDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1)

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function GitHubContributions({
  contributions,
  className,
}: {
  contributions: Promise<Activity[]>
  className?: string
}) {
  const data = use(contributions)

  if (data.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        Contribution data is unavailable.
      </div>
    )
  }

  return (
    <TooltipProvider>
      <ContributionGraph
        className={cn("mx-auto py-1 text-xs", className)}
        data={data}
        blockSize={11}
        blockMargin={3}
        blockRadius={2}
      >
        <ContributionGraphCalendar title="GitHub Contributions">
          {({ activity, dayIndex, weekIndex }) => (
            <Tooltip>
              <TooltipTrigger asChild>
                <g className="outline-none">
                  <ContributionGraphBlock
                    activity={activity}
                    dayIndex={dayIndex}
                    weekIndex={weekIndex}
                  />
                </g>
              </TooltipTrigger>
              <TooltipContent>
                {activity.count.toLocaleString("en")} contribution
                {activity.count === 1 ? "" : "s"} on{" "}
                {formatTooltipDate(activity.date)}
              </TooltipContent>
            </Tooltip>
          )}
        </ContributionGraphCalendar>

        <ContributionGraphFooter>
          <ContributionGraphTotalCount>
            {({ totalCount, year }) => (
              <div className="text-muted-foreground">
                {totalCount.toLocaleString("en")} contributions in {year}.
              </div>
            )}
          </ContributionGraphTotalCount>

          <ContributionGraphLegend />
        </ContributionGraphFooter>
      </ContributionGraph>
    </TooltipProvider>
  )
}

export function GitHubContributionsFallback() {
  return (
    <div className="flex h-36 w-full items-center justify-center text-muted-foreground">
      <Loader />
    </div>
  )
}
