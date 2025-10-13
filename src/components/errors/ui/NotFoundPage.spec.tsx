import { render, screen, within } from "@testing-library/react"
import { NotFoundPage } from "./NotFoundPage"

describe("NotFoundPage Component", () => {
  it("should render the 404 heading", () => {
    render(<NotFoundPage />)
    
    expect(screen.getByRole("heading", { name: /404 not found/i })).toBeInTheDocument()
  })

  it("should render the error message", () => {
    render(<NotFoundPage />)
    
    expect(screen.getByText(/sorry, the page you are looking for does not exist/i)).toBeInTheDocument()
  })

  it("should render a link to go back to the welcome page", () => {
    render(<NotFoundPage />)
    
    const backLink = screen.getByRole("link", { name: /go back to the welcome page/i })
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute("href", "/")
  })

  it("should render the component structure correctly", () => {
    render(<NotFoundPage />)

    const mainRegion = screen.getByRole("main")
    expect(mainRegion).toBeInTheDocument()

    expect(
      within(mainRegion).getByRole("heading", { name: /404 not found/i }),
    ).toBeInTheDocument()
    expect(
      within(mainRegion).getByText(/sorry, the page you are looking for/i),
    ).toBeInTheDocument()
    expect(
      within(mainRegion).getByRole("link", {
        name: /go back to the welcome page/i,
      }),
    ).toBeInTheDocument()
  })
})