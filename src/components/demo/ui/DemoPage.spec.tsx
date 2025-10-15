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

    expect(screen.getByText(/Welcome to the Demo feature/i)).toBeInTheDocument()
  })

  it("should render the feature files list", () => {
    render(<DemoPage title="Demo" />)

    expect(screen.getByText(/feature.meta.ts/)).toBeInTheDocument()
    expect(screen.getByText(/feature.module.ts/)).toBeInTheDocument()
    expect(screen.getByText(/feature.controller.ts/)).toBeInTheDocument()
    expect(screen.getByText(/ui\/DemoPage.tsx/)).toBeInTheDocument()
  })
})
