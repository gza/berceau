import { render, screen } from "@testing-library/react"
import { AboutPage } from "./AboutPage"

describe("AboutPage Component", () => {
  it("should render the main heading", () => {
    render(<AboutPage />)

    expect(
      screen.getByRole("heading", { name: /about us/i }),
    ).toBeInTheDocument()
  })

  it("should render the description paragraph", () => {
    render(<AboutPage />)

    expect(
      screen.getByText(/the nestsx project demonstrates/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/modern web application architecture/i),
    ).toBeInTheDocument()
  })

  it("should render the Technology Stack section", () => {
    render(<AboutPage />)

    expect(
      screen.getByRole("heading", { name: /technology stack/i }),
    ).toBeInTheDocument()
  })

  it("should render all technology stack items", () => {
    render(<AboutPage />)

    expect(screen.getByText("NestJS with TypeScript")).toBeInTheDocument()
    expect(screen.getByText("React with TypeScript")).toBeInTheDocument()
    expect(screen.getByText("Vite")).toBeInTheDocument()
    expect(
      screen.getByText("Jest and React Testing Library"),
    ).toBeInTheDocument()
    expect(screen.getByText("React Router")).toBeInTheDocument()
  })

  it("should render the Architecture Principles section", () => {
    render(<AboutPage />)

    expect(
      screen.getByRole("heading", { name: /architecture principles/i }),
    ).toBeInTheDocument()
  })

  it("should render all architecture principles", () => {
    render(<AboutPage />)

    expect(
      screen.getByText("Service-oriented architecture"),
    ).toBeInTheDocument()
    expect(screen.getByText("Domain-driven design")).toBeInTheDocument()
    expect(screen.getByText("Test-driven development")).toBeInTheDocument()
    expect(
      screen.getByText("Server-side rendering for performance"),
    ).toBeInTheDocument()
  })

  it("should render multiple lists for different sections", () => {
    render(<AboutPage />)

    const lists = screen.getAllByRole("list")
    expect(lists).toHaveLength(2) // Technology Stack + Architecture Principles
  })
})
