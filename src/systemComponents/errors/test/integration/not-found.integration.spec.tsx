import { render, screen } from "@testing-library/react"
import { NotFoundPage } from "../../ui/NotFoundPage"

describe("404 Page Integration", () => {
  it('should render the "404 Not Found" message', () => {
    render(<NotFoundPage />)

    // Expect the 404 Not Found message to be rendered
    expect(screen.getByText(/404 not found/i)).toBeInTheDocument()
  })

  it("should render a link to go back to welcome page", () => {
    render(<NotFoundPage />)

    // Expect the back link to be rendered
    expect(
      screen.getByRole("link", { name: /go back to the welcome page/i }),
    ).toBeInTheDocument()
  })
})
