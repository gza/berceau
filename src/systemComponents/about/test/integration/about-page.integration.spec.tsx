import { render, screen } from "@testing-library/react"
import { AboutPage } from "../../ui/AboutPage"

describe("About Page Integration", () => {
  it('should render the "About Us" heading', () => {
    render(<AboutPage />)

    // Expect the About Us heading to be rendered
    expect(
      screen.getByRole("heading", { name: /about us/i }),
    ).toBeInTheDocument()
  })

  it("should render technology stack information", () => {
    render(<AboutPage />)

    // Expect the technology stack to be rendered
    expect(screen.getByText(/nestjs with typescript/i)).toBeInTheDocument()
    expect(screen.getByText(/react with typescript/i)).toBeInTheDocument()
    expect(screen.getByText(/vite/i)).toBeInTheDocument()
  })
})
