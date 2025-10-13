import styles from "./not-found-page.css"

export type NotFoundPageProps = Record<string, never>

export function NotFoundPage(_: NotFoundPageProps = {}) {
  return (
    <main aria-labelledby="not-found-heading" className="not-found-page">
      <link rel="stylesheet" href={styles} />
      <h1 id="not-found-heading">404 Not Found</h1>
      <p>Sorry, the page you are looking for does not exist.</p>
      <p>
        <a href="/">Go back to the Welcome page</a>
      </p>
    </main>
  )
}
