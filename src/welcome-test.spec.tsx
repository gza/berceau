import { render, screen } from "@testing-library/react"
import { WelcomePage } from "./systemComponents/welcome/ui/WelcomePage"

describe("Welcome Page Test", () => {
  it("should render the welcome heading", () => {
    render(<WelcomePage />)

    expect(
      screen.getByRole("heading", { name: /welcome to the berceau/i }),
    ).toBeInTheDocument()
  })
})
