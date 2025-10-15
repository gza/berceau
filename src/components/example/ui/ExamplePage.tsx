import styles from "./example-page.css"

export function ExamplePage() {
  return (
    <div className="example-page">
      <link rel="stylesheet" href={styles} />
      <h1>About Us</h1>
      <p>
        The NesTsx project demonstrates a modern web application architecture
        that combines the power of NestJS and React within a single codebase.
      </p>
      <h2>Technology Stack</h2>
      <ul>
        <li>
          <strong>Backend:</strong> NestJS with TypeScript
        </li>
        <li>
          <strong>Frontend:</strong> React with TypeScript
        </li>
        <li>
          <strong>Build Tool:</strong> Vite
        </li>
        <li>
          <strong>Testing:</strong> Jest and React Testing Library
        </li>
        <li>
          <strong>Routing:</strong> React Router
        </li>
      </ul>
      <h2>Architecture Principles</h2>
      <ul>
        <li>Service-oriented architecture</li>
        <li>Domain-driven design</li>
        <li>Test-driven development</li>
        <li>Server-side rendering for performance</li>
      </ul>
    </div>
  )
}
