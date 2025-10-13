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
    <nav
      style={{
        width: "200px",
        backgroundColor: "#f5f5f5",
        padding: "20px",
        borderRight: "1px solid #ddd",
      }}
    >
      <h2>Navigation</h2>
      <ul style={{ listStyle: "none", padding: "0" }}>
        {menuItems.map((item) => {
          const isActive = currentPath === item.path

          return (
            <li key={item.path} style={{ marginBottom: "10px" }}>
              <a
                href={item.path}
                style={{
                  textDecoration: "none",
                  color: "#333",
                  padding: "8px 12px",
                  display: "block",
                  borderRadius: "4px",
                  fontWeight: isActive ? "bold" : "normal",
                  backgroundColor: isActive ? "#e0e0e0" : "transparent",
                }}
                aria-current={isActive ? "page" : undefined}
              >
                {item.icon} {item.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}