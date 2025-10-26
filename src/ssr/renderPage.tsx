import { renderToString } from "react-dom/server"
import type { ReactElement } from "react"
import type { Request } from "express"
import { AppLayout } from "../systemComponents/core/ui/AppLayout"
import { HtmlDocument } from "../systemComponents/core/ui/HtmlDocument"
import { runInContext } from "../csrf/csrf-context"
import { CsrfService } from "../csrf/csrf.service"

export interface RenderPageOptions {
  title?: string
  scripts?: string[]
  currentPath?: string
  /** Express request object (required for CSRF token generation) */
  request?: Request
}

export function renderPage(
  content: ReactElement,
  options: RenderPageOptions = {},
) {
  const { title, scripts, currentPath, request } = options

  // If request is provided and has a session, set up CSRF context for SSR
  if (request?.session) {
    const csrfService = new CsrfService()
    return runInContext(
      {
        request: {
          session: request.session as unknown as Record<string, unknown>,
        },
        service: csrfService,
      },
      () => {
        const view = renderToString(
          <HtmlDocument title={title} scripts={scripts}>
            <AppLayout currentPath={currentPath}>{content}</AppLayout>
          </HtmlDocument>,
        )
        return `<!DOCTYPE html>${view}`
      },
    )
  }

  // Fallback without CSRF context (for tests that don't need it)
  const view = renderToString(
    <HtmlDocument title={title} scripts={scripts}>
      <AppLayout currentPath={currentPath}>{content}</AppLayout>
    </HtmlDocument>,
  )

  return `<!DOCTYPE html>${view}`
}
