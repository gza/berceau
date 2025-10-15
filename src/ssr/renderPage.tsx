import { renderToString } from "react-dom/server"
import type { ReactElement } from "react"
import { AppLayout } from "../systemComponents/core/ui/AppLayout"
import { HtmlDocument } from "../systemComponents/core/ui/HtmlDocument"

export interface RenderPageOptions {
  title?: string
  scripts?: string[]
  currentPath?: string
}

export function renderPage(
  content: ReactElement,
  options: RenderPageOptions = {},
) {
  const { title, scripts, currentPath } = options
  const view = renderToString(
    <HtmlDocument title={title} scripts={scripts}>
      <AppLayout currentPath={currentPath}>{content}</AppLayout>
    </HtmlDocument>,
  )

  return `<!DOCTYPE html>${view}`
}
