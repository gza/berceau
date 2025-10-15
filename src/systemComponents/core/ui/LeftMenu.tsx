import type { ReactNode } from "react"
import { navigation } from "../../../components.generated/features.registry"

interface NavLink {
  label: string
  path: string
  icon?: ReactNode
}

// Core navigation items (system pages)
const coreMenuItems: NavLink[] = [
  { label: "Welcome", path: "/" },
  { label: "About", path: "/about" },
]

// Combine core navigation with dynamically discovered feature navigation
const menuItems: NavLink[] = [...coreMenuItems, ...navigation]

export interface LeftMenuProps {
  currentPath?: string
}

export function LeftMenu({ currentPath }: LeftMenuProps = {}) {
  return (
    <nav>
      <h2>Navigation</h2>
      <ul>
        {menuItems.map((item) => {
          const isActive = currentPath === item.path

          return (
            <li key={item.path}>
              <a href={item.path} aria-current={isActive ? "page" : undefined}>
                {item.icon} {item.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
