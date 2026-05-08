"use client"

import {
  createContext,
  type CSSProperties,
  Fragment,
  type HTMLAttributes,
  type ReactNode,
  useContext,
  useMemo,
} from "react"

import { cn } from "@/lib/utils"

export type Activity = {
  date: string
  count: number
  level: number
}

type Week = Array<Activity | undefined>

export type Labels = {
  months?: string[]
  totalCount?: string
  legend?: {
    less?: string
    more?: string
  }
}

type MonthLabel = {
  weekIndex: number
  label: string
}

const DEFAULT_MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

const DEFAULT_LABELS: Labels = {
  months: DEFAULT_MONTH_LABELS,
  totalCount: "{{count}} activities in {{year}}",
  legend: {
    less: "Less",
    more: "More",
  },
}

const THEME = cn(
  'data-[level="0"]:fill-muted-foreground/10',
  'data-[level="1"]:fill-muted-foreground/25',
  'data-[level="2"]:fill-muted-foreground/45',
  'data-[level="3"]:fill-muted-foreground/65',
  'data-[level="4"]:fill-muted-foreground/85'
)

type ContributionGraphContextType = {
  weeks: Week[]
  blockMargin: number
  blockRadius: number
  blockSize: number
  fontSize: number
  labels: Labels
  labelHeight: number
  maxLevel: number
  totalCount: number
  year: number
  width: number
  height: number
}

const ContributionGraphContext =
  createContext<ContributionGraphContextType | null>(null)

function useContributionGraph() {
  const context = useContext(ContributionGraphContext)

  if (!context) {
    throw new Error(
      "ContributionGraph components must be used within a ContributionGraph"
    )
  }

  return context
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1)
}

function formatDate(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function addDays(value: Date, days: number) {
  const next = new Date(value)
  next.setDate(value.getDate() + days)
  return next
}

function daysBetween(start: Date, end: Date) {
  const startUtc = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  )
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
  return Math.round((endUtc - startUtc) / 86_400_000)
}

function fillHoles(activities: Activity[]): Activity[] {
  if (activities.length === 0) {
    return []
  }

  const sortedActivities = [...activities].sort((a, b) =>
    a.date.localeCompare(b.date)
  )
  const calendar = new Map(
    sortedActivities.map((activity) => [activity.date, activity])
  )
  const firstActivity = sortedActivities[0]
  const lastActivity = sortedActivities.at(-1)

  if (!firstActivity || !lastActivity) {
    return []
  }

  const firstDate = parseDate(firstActivity.date)
  const lastDate = parseDate(lastActivity.date)
  const dayCount = daysBetween(firstDate, lastDate)

  return Array.from({ length: dayCount + 1 }, (_, index) => {
    const date = formatDate(addDays(firstDate, index))
    return calendar.get(date) ?? { date, count: 0, level: 0 }
  })
}

function groupByWeeks(activities: Activity[]): Week[] {
  const normalizedActivities = fillHoles(activities)

  if (normalizedActivities.length === 0) {
    return []
  }

  const firstActivity = normalizedActivities[0]
  if (!firstActivity) {
    return []
  }

  const firstDay = parseDate(firstActivity.date).getDay()
  const paddedActivities = [
    ...(new Array(firstDay).fill(undefined) as undefined[]),
    ...normalizedActivities,
  ]
  const numberOfWeeks = Math.ceil(paddedActivities.length / 7)

  return Array.from({ length: numberOfWeeks }, (_, weekIndex) =>
    paddedActivities.slice(weekIndex * 7, weekIndex * 7 + 7)
  )
}

function getMonthLabels(
  weeks: Week[],
  monthNames: string[] = DEFAULT_MONTH_LABELS
): MonthLabel[] {
  return weeks
    .reduce<MonthLabel[]>((labels, week, weekIndex) => {
      const firstActivity = week.find((activity) => activity !== undefined)

      if (!firstActivity) {
        return labels
      }

      const month = monthNames[parseDate(firstActivity.date).getMonth()]
      const prevLabel = labels.at(-1)

      if (
        month &&
        (weekIndex === 0 || !prevLabel || prevLabel.label !== month)
      ) {
        return labels.concat({ weekIndex, label: month })
      }

      return labels
    }, [])
    .filter(({ weekIndex }, index, labels) => {
      const minWeeks = 3

      if (index === 0) {
        return labels[1] && labels[1].weekIndex - weekIndex >= minWeeks
      }

      if (index === labels.length - 1) {
        return weeks.slice(weekIndex).length >= minWeeks
      }

      return true
    })
}

export type ContributionGraphProps = HTMLAttributes<HTMLDivElement> & {
  data: Activity[]
  blockMargin?: number
  blockRadius?: number
  blockSize?: number
  fontSize?: number
  labels?: Labels
  maxLevel?: number
  style?: CSSProperties
  totalCount?: number
  children: ReactNode
}

export function ContributionGraph({
  data,
  blockMargin = 4,
  blockRadius = 2,
  blockSize = 12,
  fontSize = 12,
  labels: labelsProp,
  maxLevel: maxLevelProp = 4,
  style = {},
  totalCount: totalCountProp,
  className,
  ...props
}: ContributionGraphProps) {
  const maxLevel = Math.max(1, maxLevelProp)
  const weeks = useMemo(() => groupByWeeks(data), [data])
  const labelHeight = fontSize + 8
  const labels = { ...DEFAULT_LABELS, ...labelsProp }
  const firstActivity = data[0]
  const year = firstActivity
    ? parseDate(firstActivity.date).getFullYear()
    : new Date().getFullYear()
  const totalCount =
    typeof totalCountProp === "number"
      ? totalCountProp
      : data.reduce((sum, activity) => sum + activity.count, 0)
  const width = weeks.length * (blockSize + blockMargin) - blockMargin
  const height = labelHeight + (blockSize + blockMargin) * 7 - blockMargin

  if (data.length === 0) {
    return null
  }

  return (
    <ContributionGraphContext.Provider
      value={{
        weeks,
        blockMargin,
        blockRadius,
        blockSize,
        fontSize,
        labels,
        labelHeight,
        maxLevel,
        totalCount,
        year,
        width,
        height,
      }}
    >
      <div
        className={cn("flex w-max max-w-full flex-col gap-2", className)}
        style={{ fontSize, ...style }}
        {...props}
      />
    </ContributionGraphContext.Provider>
  )
}

export type ContributionGraphBlockProps = HTMLAttributes<SVGRectElement> & {
  activity: Activity
  dayIndex: number
  weekIndex: number
}

export function ContributionGraphBlock({
  activity,
  dayIndex,
  weekIndex,
  className,
  ...props
}: ContributionGraphBlockProps) {
  const { blockSize, blockMargin, blockRadius, labelHeight, maxLevel } =
    useContributionGraph()

  if (activity.level < 0 || activity.level > maxLevel) {
    throw new RangeError(
      `Provided activity level ${activity.level} for ${activity.date} is out of range. It must be between 0 and ${maxLevel}.`
    )
  }

  return (
    <rect
      className={cn(THEME, className)}
      data-count={activity.count}
      data-date={activity.date}
      data-level={activity.level}
      height={blockSize}
      rx={blockRadius}
      ry={blockRadius}
      width={blockSize}
      x={(blockSize + blockMargin) * weekIndex}
      y={labelHeight + (blockSize + blockMargin) * dayIndex}
      {...props}
    />
  )
}

export type ContributionGraphCalendarProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  hideMonthLabels?: boolean
  children: (props: {
    activity: Activity
    dayIndex: number
    weekIndex: number
  }) => ReactNode
}

export function ContributionGraphCalendar({
  title = "Contribution Graph",
  hideMonthLabels = false,
  className,
  children,
  ...props
}: ContributionGraphCalendarProps) {
  const { weeks, width, height, blockSize, blockMargin, labels } =
    useContributionGraph()
  const monthLabels = useMemo(
    () => getMonthLabels(weeks, labels.months),
    [weeks, labels.months]
  )

  return (
    <div
      className={cn(
        "max-w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
      {...props}
    >
      <svg
        className="block h-auto min-w-[720px] overflow-visible lg:w-full"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
      >
        <title>{title}</title>
        {!hideMonthLabels && (
          <g className="fill-current text-muted-foreground">
            {monthLabels.map(({ label, weekIndex }) => (
              <text
                dominantBaseline="hanging"
                key={weekIndex}
                x={(blockSize + blockMargin) * weekIndex}
              >
                {label}
              </text>
            ))}
          </g>
        )}
        {weeks.map((week, weekIndex) =>
          week.map((activity, dayIndex) => {
            if (!activity) {
              return null
            }

            return (
              <Fragment key={`${weekIndex}-${dayIndex}`}>
                {children({ activity, dayIndex, weekIndex })}
              </Fragment>
            )
          })
        )}
      </svg>
    </div>
  )
}

export function ContributionGraphFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 whitespace-nowrap sm:gap-x-4",
        className
      )}
      {...props}
    />
  )
}

export type ContributionGraphTotalCountProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  children?: (props: { totalCount: number; year: number }) => ReactNode
}

export function ContributionGraphTotalCount({
  className,
  children,
  ...props
}: ContributionGraphTotalCountProps) {
  const { totalCount, year, labels } = useContributionGraph()

  if (children) {
    return <>{children({ totalCount, year })}</>
  }

  return (
    <div className={cn("text-muted-foreground", className)} {...props}>
      {labels.totalCount
        ? labels.totalCount
            .replace("{{count}}", String(totalCount))
            .replace("{{year}}", String(year))
        : `${totalCount} activities in ${year}`}
    </div>
  )
}

export type ContributionGraphLegendProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  children?: (props: { level: number }) => ReactNode
}

export function ContributionGraphLegend({
  className,
  children,
  ...props
}: ContributionGraphLegendProps) {
  const { labels, maxLevel, blockSize, blockRadius } = useContributionGraph()

  return (
    <div
      className={cn("ml-auto flex items-center gap-1 text-xs", className)}
      {...props}
    >
      <span className="mr-1 text-muted-foreground">
        {labels.legend?.less || "Less"}
      </span>
      {Array.from({ length: maxLevel + 1 }, (_, level) =>
        children ? (
          <Fragment key={level}>{children({ level })}</Fragment>
        ) : (
          <svg height={blockSize} key={level} width={blockSize}>
            <title>{`${level} contributions`}</title>
            <rect
              className={THEME}
              data-level={level}
              height={blockSize}
              rx={blockRadius}
              ry={blockRadius}
              width={blockSize}
            />
          </svg>
        )
      )}
      <span className="ml-1 text-muted-foreground">
        {labels.legend?.more || "More"}
      </span>
    </div>
  )
}
