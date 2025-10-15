import { render, screen } from "@testing-library/react"
import { WelcomePage } from "../../ui/WelcomePage"

describe("Welcome Page Integration", () => {
  it('should render the "Welcome to the Berceau" heading', () => {
    render(<WelcomePage />)

    // Expect the Welcome heading to be rendered
    expect(
      screen.getByRole("heading", { name: /welcome to the berceau/i }),
    ).toBeInTheDocument()
  })

  it("should render feature list", () => {
    render(<WelcomePage />)

    // Expect the features to be rendered
    expect(
      screen.getByText("Server-Side Rendering (SSR) with React"),
    ).toBeInTheDocument()
    expect(screen.getByText("NestJS backend architecture")).toBeInTheDocument()
    expect(
      screen.getByText("Domain-driven project structure"),
    ).toBeInTheDocument()
  })
})
