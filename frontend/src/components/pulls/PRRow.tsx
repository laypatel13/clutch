import type { ReactNode } from 'react'

interface PRRowProps {
  href: string
  title: string
  meta: ReactNode
  /** Rendered inside the title line, before the title — e.g. an `external` tag. */
  titlePrefix?: ReactNode
  /** Icon at the row's left edge, e.g. the pull request state. */
  leading?: ReactNode
  trailing?: ReactNode
  /** Rows sitting on an accent panel need their own card background. */
  filled?: boolean
}

export default function PRRow({
  href,
  title,
  meta,
  titlePrefix,
  leading,
  trailing,
  filled,
}: PRRowProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="pr-row"
      data-filled={filled ? 'true' : undefined}
    >
      <div className="pr-row-main">
        {leading}
        <div className="pr-row-body">
          <div className="pr-row-title-line">
            {titlePrefix}
            {/* The title truncates, so carry the full text for anyone who needs it. */}
            <span className="pr-row-title" title={title}>{title}</span>
          </div>
          <div className="meta-mono">{meta}</div>
        </div>
      </div>
      {trailing && <div className="pr-row-trailing">{trailing}</div>}
    </a>
  )
}
