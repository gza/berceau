/**
 * Unit test for DemoPage component
 */

import { render, screen } from "@testing-library/react"
import { DemoPage } from "./DemoPage"

describe("DemoPage", () => {
  it("should render the title", () => {
    render(<DemoPage title="Test Demo" />)

    expect(screen.getByText("Test Demo")).toBeInTheDocument()
  })

  it("should render the welcome message", () => {
    render(<DemoPage title="Demo" />)

    expect(
      screen.getByText(/Welcome to the Demo component/i),
    ).toBeInTheDocument()
  })

  it("should render the component files list", () => {
    render(<DemoPage title="Demo" />)

    expect(screen.getByText(/component.meta.ts/i)).toBeInTheDocument()
    expect(screen.getByText(/component.controller.ts/)).toBeInTheDocument()
    expect(screen.getByText(/ui\/DemoPage.tsx/)).toBeInTheDocument()
  })
})
