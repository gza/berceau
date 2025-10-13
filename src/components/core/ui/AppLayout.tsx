import type { ReactNode } from "react"
import { LeftMenu } from "./LeftMenu"

export interface AppLayoutProps {
  children: ReactNode
  currentPath?: string
}

export function AppLayout({ children, currentPath }: AppLayoutProps) {
  return (
    <div>
      <LeftMenu currentPath={currentPath} />
      <main>
        {children}
      </main>
    </div>
  )
}
