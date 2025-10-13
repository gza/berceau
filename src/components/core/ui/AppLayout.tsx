import type { ReactNode } from "react"
import { LeftMenu } from "./LeftMenu"

export interface AppLayoutProps {
  children: ReactNode
  currentPath?: string
}

export function AppLayout({ children, currentPath }: AppLayoutProps) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <LeftMenu currentPath={currentPath} />
      <main style={{ flex: 1, padding: "20px" }}>
        {children}
      </main>
    </div>
  )
}
