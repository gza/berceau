import { render, screen } from "@testing-library/react"
import { LeftMenu } from "./LeftMenu"

describe("LeftMenu Component", () => {
  it("should render the navigation title", () => {
    render(<LeftMenu />)
    
    expect(screen.getByRole("heading", { name: /navigation/i })).toBeInTheDocument()
  })

  it("should render the correct navigation links", () => {
    render(<LeftMenu />)
    
    // Check for Welcome link
    const welcomeLink = screen.getByRole("link", { name: /welcome/i })
    expect(welcomeLink).toBeInTheDocument()
    expect(welcomeLink).toHaveAttribute("href", "/")
    
    // Check for About link
    const aboutLink = screen.getByRole("link", { name: /about/i })
    expect(aboutLink).toBeInTheDocument()
    expect(aboutLink).toHaveAttribute("href", "/about")
  })

  it("should render as a nav element", () => {
    render(<LeftMenu />)
    
    const navElement = screen.getByRole("navigation")
    expect(navElement).toBeInTheDocument()
  })

  it("should render all menu items in a list", () => {
    render(<LeftMenu />)
    
    const list = screen.getByRole("list")
    expect(list).toBeInTheDocument()
    
    const listItems = screen.getAllByRole("listitem")
    expect(listItems).toHaveLength(2)
  })

  it("should mark the active link when currentPath is provided", () => {
    render(<LeftMenu currentPath="/about" />)

    const aboutLink = screen.getByRole("link", { name: /about/i })
    expect(aboutLink).toHaveAttribute("aria-current", "page")

    const welcomeLink = screen.getByRole("link", { name: /welcome/i })
    expect(welcomeLink).not.toHaveAttribute("aria-current")
  })
})