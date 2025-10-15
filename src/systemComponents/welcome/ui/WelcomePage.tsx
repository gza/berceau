// Direct SVG import - webpack will handle this
import welcomeSvg from "./welcome.svg"
import styles from "./welcome-page.css"

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Props {}

export function WelcomePage(_props: Props) {
  // get current date
  const currentDate = new Date().toLocaleDateString()
  return (
    <div className="welcome-page">
      <link rel="stylesheet" href={styles} />
      <img src={welcomeSvg} alt="Welcome" />
      <h1>Welcome to the NesTsx on {currentDate}</h1>
      <p>
        This is the main welcome page of the NesTsx application. The application
        features a unified architecture with server-side rendering capabilities,
        combining NestJS on the backend with React on the frontend.
      </p>
      <h2>Features</h2>
      <ul>
        <li>Server-Side Rendering (SSR) with React</li>
        <li>NestJS backend architecture</li>
        <li>Domain-driven project structure</li>
        <li>Test-driven development approach</li>
      </ul>
    </div>
  )
}
