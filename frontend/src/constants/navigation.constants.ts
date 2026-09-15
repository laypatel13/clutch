import { CalendarDays, GitPullRequest, CircleUserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
}

// Sidebar items, top to bottom. To add a new section later (e.g. LeetCode),
// just append an entry here — AppSidebar renders whatever's in this array.
export const getNavItems = (username?: string): NavItem[] => [
  { label: 'Today', path: '/dashboard', icon: CalendarDays },
  { label: 'Pull Requests', path: '/pulls', icon: GitPullRequest },
  { label: 'Profile', path: `/u/${username || ''}`, icon: CircleUserRound },
]

export const SIDEBAR_STORAGE_KEY = 'sidebar-expanded'
