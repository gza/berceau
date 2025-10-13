import type { ReactNode } from "react"
import styles from "./styles.css"

export interface HtmlDocumentProps {
  children: ReactNode
  title?: string
  scripts?: string[]
}

export function HtmlDocument({
  children,
  title = "Monobackend",
  scripts = [],
}: HtmlDocumentProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="stylesheet" href={styles} />
      </head>
      <body>
        <div id="root">
          {children}
        </div>
        {scripts.map((script) => (
          <script key={script} type="module" src={script} />
        ))}
      </body>
    </html>
  )
}
