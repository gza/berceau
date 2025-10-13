import { renderPage } from "./renderPage"
import { WelcomePage } from "../components/welcome/ui/WelcomePage"

describe("renderPage", () => {
  it("should wrap the provided component in an HTML document", () => {
    const view = renderPage(<WelcomePage />, { title: "Custom Title" })

    expect(view).toContain("<!DOCTYPE html>")
    expect(view).toContain("<html")
    expect(view).toContain("Custom Title")
    expect(view).toContain("Welcome to the NesTsx")
    expect(view).not.toContain("<script")
  })

  it("should annotate navigation for the current path when provided", () => {
    const view = renderPage(<WelcomePage />, { currentPath: "/" })

    expect(view).toContain('aria-current="page"')
  })
})
