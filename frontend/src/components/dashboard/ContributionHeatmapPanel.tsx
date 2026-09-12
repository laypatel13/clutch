import { useState } from 'react'
import PanelHeader from '../common/PanelHeader'
import type { HeatmapData, HeatmapDay } from '../../types/dashboard.types'

interface HeatmapProps {
  data: HeatmapData | null
}

interface HoveredCell {
  day: HeatmapDay
  x: number
  y: number
}

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const CELL_SIZE = 11
const CELL_GAP = 3
const LABEL_GUTTER = 24

// Five steps of one green ramp, defined as tokens so the scale stays in the
// design system and flips direction for the dark theme.
function intensity(count: number, max: number): string {
  if (count === 0) return 'var(--heat-0)'
  const ratio = count / Math.max(max, 1)
  if (ratio > 0.75) return 'var(--heat-4)'
  if (ratio > 0.5) return 'var(--heat-3)'
  if (ratio > 0.25) return 'var(--heat-2)'
  return 'var(--heat-1)'
}

function formatCount(count: number): string {
  return `${count} contribution${count === 1 ? '' : 's'}`
}

function HeatmapGrid({ data }: HeatmapProps) {
  const [hovered, setHovered] = useState<HoveredCell | null>(null)

  if (!data || data.days.length === 0) {
    return <p className="empty-state">No activity data — click Sync to load.</p>
  }

  // Build week columns, padding the first week so it starts on Monday
  const days = data.days
  const firstDate = new Date(days[0].date + 'T00:00:00')
  const firstWeekday = (firstDate.getDay() + 6) % 7 // 0 = Monday
  const padding: (typeof days[number] | null)[] = Array.from({ length: firstWeekday }, () => null)
  const padded: (typeof days[number] | null)[] = padding.concat(days)

  const weeks: (typeof days[number] | null)[][] = []
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7))
  }

  // Month labels — find which week index each month starts in
  const monthLabels: { week: number; label: string }[] = []
  let lastMonth = -1
  weeks.forEach((week, wi) => {
    const firstValid = week.find((d) => d !== null)
    if (!firstValid) return
    const month = new Date(firstValid.date + 'T00:00:00').getMonth()
    if (month !== lastMonth) {
      monthLabels.push({ week: wi, label: MONTH_NAMES[month] })
      lastMonth = month
    }
  })

  const handleEnter = (day: HeatmapDay | null) => (e: React.MouseEvent<HTMLDivElement>) => {
    if (!day) return
    const cellRect = e.currentTarget.getBoundingClientRect()
    const wrapperRect = e.currentTarget.closest('[data-heatmap-wrapper]')?.getBoundingClientRect()
    if (!wrapperRect) return
    setHovered({
      day,
      x: cellRect.left - wrapperRect.left + cellRect.width / 2,
      y: cellRect.top - wrapperRect.top,
    })
  }

  const handleLeave = () => setHovered(null)

  return (
    <div className="heatmap-scroll">
      <div data-heatmap-wrapper className="heatmap-wrapper">
        <div className="heatmap-months" style={{ marginLeft: LABEL_GUTTER }}>
          {weeks.map((_, wi) => {
            const m = monthLabels.find((m) => m.week === wi)
            return (
              <div key={wi} className="heatmap-month-label" style={{ width: CELL_SIZE + CELL_GAP }}>
                {m ? m.label : ''}
              </div>
            )
          })}
        </div>

        <div className="heatmap-body" style={{ gap: CELL_GAP }}>
          <div className="heatmap-daylabels" style={{ gap: CELL_GAP }}>
            {DAY_LABELS.map((label, i) => (
              <div key={i} className="heatmap-day-label" style={{ height: CELL_SIZE }}>
                {label}
              </div>
            ))}
          </div>

          {weeks.map((week, wi) => (
            <div key={wi} className="heatmap-week" style={{ gap: CELL_GAP }}>
              {week.map((day, di) => (
                <div
                  key={di}
                  onMouseEnter={handleEnter(day)}
                  onMouseLeave={handleLeave}
                  className="heatmap-cell"
                  data-empty={day ? undefined : 'true'}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    background: day ? intensity(day.count, data.max_count) : undefined,
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="heatmap-legend" style={{ marginLeft: LABEL_GUTTER }}>
          <span className="heatmap-legend-text">Less</span>
          {[0, 0.2, 0.4, 0.7, 1].map((r, i) => (
            <div
              key={i}
              className="heatmap-cell"
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                background: intensity(Math.round(r * data.max_count), data.max_count),
              }}
            />
          ))}
          <span className="heatmap-legend-text">More</span>
        </div>

        {hovered && (
          <div className="heatmap-tooltip" style={{ left: hovered.x, top: hovered.y - 8 }}>
            <div className="heatmap-tooltip-date">{hovered.day.date}</div>
            <div className="heatmap-tooltip-count">{formatCount(hovered.day.count)}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Heatmap({ data }: HeatmapProps) {
  return (
    <div className="nb-card nb-accent-yellow panel">
      <PanelHeader
        label="contribution heatmap"
        trailing={
          <span className="tag tag-outline">
            {data ? `${data.total_contributions} in the last year` : 'last 12 months'}
          </span>
        }
      />
      <HeatmapGrid data={data} />
    </div>
  )
}
