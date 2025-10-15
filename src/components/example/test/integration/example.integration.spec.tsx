import { render, screen } from "@testing-library/react"
import { ExamplePage } from "../../ui/ExamplePage"

describe("Example Page Integration", () => {
  it('should render the "Example Us" heading', () => {
    render(<ExamplePage />)

    // Expect the Example Us heading to be rendered
    expect(
      screen.getByRole("heading", { name: /about us/i }),
    ).toBeInTheDocument()
  })

  it("should render technology stack information", () => {
    render(<ExamplePage />)

    // Expect the technology stack to be rendered
    expect(screen.getByText(/nestjs with typescript/i)).toBeInTheDocument()
    expect(screen.getByText(/react with typescript/i)).toBeInTheDocument()
    expect(screen.getByText(/vite/i)).toBeInTheDocument()
  })
})
