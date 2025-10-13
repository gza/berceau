import { render, screen } from "@testing-library/react"
import { WelcomePage } from "./WelcomePage"

describe("WelcomePage Component", () => {
  it("should render the main heading", () => {
    render(<WelcomePage />)
    
    expect(screen.getByRole("heading", { name: /welcome to the monobackend/i })).toBeInTheDocument()
  })

  it("should render the description paragraph", () => {
    render(<WelcomePage />)
    
    expect(screen.getByText(/this is the main welcome page/i)).toBeInTheDocument()
    expect(screen.getByText(/unified architecture with server-side rendering/i)).toBeInTheDocument()
  })

  it("should render the Features section", () => {
    render(<WelcomePage />)
    
    expect(screen.getByRole("heading", { name: /features/i })).toBeInTheDocument()
  })

  it("should render all feature list items", () => {
    render(<WelcomePage />)
    
    expect(screen.getByText("Server-Side Rendering (SSR) with React")).toBeInTheDocument()
    expect(screen.getByText("NestJS backend architecture")).toBeInTheDocument()
    expect(screen.getByText("Domain-driven project structure")).toBeInTheDocument()
    expect(screen.getByText("Test-driven development approach")).toBeInTheDocument()
  })

  it("should render the feature list as an unordered list", () => {
    render(<WelcomePage />)
    
    const list = screen.getByRole("list")
    expect(list).toBeInTheDocument()
    
    const listItems = screen.getAllByRole("listitem")
    expect(listItems).toHaveLength(4)
  })
})