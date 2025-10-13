import type { ReactNode } from "react"

interface NavLink {
  label: string
  path: string
  icon?: ReactNode
}

const menuItems: NavLink[] = [
  { label: "Welcome", path: "/" },
  { label: "About", path: "/about" },
]

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
