import svg from "./welcome.svg"

export function WelcomePage() {
  // get current date
  const currentDate = new Date().toLocaleDateString()
  return (
    <div>
      <h1>Welcome to the Monobackend on {currentDate}</h1>
      <p>
        This is the main welcome page of the Monobackend application. 
        The application features a unified architecture with server-side rendering 
        capabilities, combining NestJS on the backend with React on the frontend.
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