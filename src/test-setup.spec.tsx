import { render, screen } from "@testing-library/react"

// Simple test to verify Jest setup
describe("Jest Setup Test", () => {
  it("should work with basic React rendering", () => {
    const TestComponent = () => <div>Hello Test</div>

    render(<TestComponent />)

    expect(screen.getByText("Hello Test")).toBeInTheDocument()
  })
})
