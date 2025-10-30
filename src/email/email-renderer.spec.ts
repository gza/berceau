/**
 * Unit tests for email JSX renderer
 *
 * Tests ReactElement to HTML conversion, props rendering, and formatting preservation
 */

import React from "react"
import { renderEmailBody } from "./renderer"

describe("Email Renderer", () => {
  describe("renderEmailBody", () => {
    it("should render a simple JSX element to HTML string", () => {
      const element = React.createElement("div", null, "Hello World")
      const view = renderEmailBody(element)

      expect(view).toContain("<div")
      expect(view).toContain("Hello World")
      expect(view).toContain("</div>")
    })

    it("should render JSX with props", () => {
      const element = React.createElement(
        "div",
        { className: "email-container", id: "test-id" },
        "Content",
      )
      const view = renderEmailBody(element)

      expect(view).toContain('class="email-container"')
      expect(view).toContain('id="test-id"')
      expect(view).toContain("Content")
    })

    it("should render nested JSX elements", () => {
      const element = React.createElement(
        "div",
        null,
        React.createElement("h1", null, "Title"),
        React.createElement("p", null, "Paragraph"),
      )
      const view = renderEmailBody(element)

      expect(view).toContain("<h1>Title</h1>")
      expect(view).toContain("<p>Paragraph</p>")
    })

    it("should render JSX with dynamic props", () => {
      interface EmailProps {
        name: string
        date: string
      }

      const EmailTemplate: React.FC<EmailProps> = ({ name, date }) =>
        React.createElement(
          "div",
          null,
          React.createElement("h1", null, `Hello ${name}`),
          React.createElement("p", null, `Date: ${date}`),
        )

      const element = React.createElement(EmailTemplate, {
        name: "John Doe",
        date: "2025-10-29",
      })
      const view = renderEmailBody(element)

      expect(view).toContain("Hello John Doe")
      expect(view).toContain("Date: 2025-10-29")
    })

    it("should preserve bold formatting", () => {
      const element = React.createElement(
        "div",
        null,
        React.createElement("strong", null, "Bold Text"),
        React.createElement("b", null, "Also Bold"),
      )
      const view = renderEmailBody(element)

      expect(view).toContain("<strong>Bold Text</strong>")
      expect(view).toContain("<b>Also Bold</b>")
    })

    it("should preserve link formatting", () => {
      const element = React.createElement(
        "div",
        null,
        React.createElement(
          "a",
          { href: "https://example.com", target: "_blank" },
          "Click Here",
        ),
      )
      const view = renderEmailBody(element)

      expect(view).toContain('href="https://example.com"')
      expect(view).toContain('target="_blank"')
      expect(view).toContain("Click Here")
    })

    it("should preserve image elements with attributes", () => {
      const element = React.createElement(
        "div",
        null,
        React.createElement("img", {
          src: "https://example.com/image.png",
          alt: "Test Image",
          width: 200,
          height: 100,
        }),
      )
      const view = renderEmailBody(element)

      expect(view).toContain('src="https://example.com/image.png"')
      expect(view).toContain('alt="Test Image"')
      expect(view).toContain('width="200"')
      expect(view).toContain('height="100"')
    })

    it("should handle inline styles", () => {
      const element = React.createElement(
        "div",
        {
          style: {
            backgroundColor: "#f0f0f0",
            color: "#333",
            padding: "10px",
          },
        },
        "Styled Content",
      )
      const view = renderEmailBody(element)

      expect(view).toContain("background-color:#f0f0f0")
      expect(view).toContain("color:#333")
      expect(view).toContain("padding:10px")
    })

    it("should render complex email template with multiple formatting types", () => {
      interface ComplexEmailProps {
        title: string
        message: string
        linkUrl: string
        linkText: string
        imageUrl: string
      }

      const ComplexEmail: React.FC<ComplexEmailProps> = ({
        title,
        message,
        linkUrl,
        linkText,
        imageUrl,
      }) =>
        React.createElement(
          "div",
          { style: { fontFamily: "Arial, sans-serif" } },
          React.createElement("h1", { style: { color: "#333" } }, title),
          React.createElement(
            "p",
            null,
            React.createElement("strong", null, message),
          ),
          React.createElement(
            "a",
            { href: linkUrl, style: { color: "#0066cc" } },
            linkText,
          ),
          React.createElement("img", { src: imageUrl, alt: "Email Image" }),
        )

      const element = React.createElement(ComplexEmail, {
        title: "Welcome!",
        message: "Thank you for joining us",
        linkUrl: "https://example.com/welcome",
        linkText: "Get Started",
        imageUrl: "https://example.com/banner.png",
      })
      const view = renderEmailBody(element)

      expect(view).toContain("Welcome!")
      expect(view).toContain("<strong>Thank you for joining us</strong>")
      expect(view).toContain('href="https://example.com/welcome"')
      expect(view).toContain("Get Started")
      expect(view).toContain('src="https://example.com/banner.png"')
    })

    it("should escape dangerous HTML content", () => {
      const element = React.createElement(
        "div",
        null,
        "<script>alert('xss')</script>",
      )
      const view = renderEmailBody(element)

      // React automatically escapes content
      expect(view).not.toContain("<script>")
      expect(view).toContain("&lt;script&gt;")
    })

    it("should throw error with descriptive message on render failure", () => {
      // Create an element that will fail to render
      const BadComponent: React.FC = () => {
        throw new Error("Intentional render error")
      }
      const element = React.createElement(BadComponent)

      expect(() => renderEmailBody(element)).toThrow(
        "Failed to render JSX to HTML: Intentional render error",
      )
    })

    it("should handle empty content", () => {
      const element = React.createElement("div", null)
      const view = renderEmailBody(element)

      expect(view).toContain("<div")
      expect(view).toContain("</div>")
    })

    it("should render table structures for email layout", () => {
      const element = React.createElement(
        "table",
        { cellPadding: 0, cellSpacing: 0, border: 0 },
        React.createElement(
          "tbody",
          null,
          React.createElement(
            "tr",
            null,
            React.createElement("td", null, "Cell 1"),
            React.createElement("td", null, "Cell 2"),
          ),
        ),
      )
      const view = renderEmailBody(element)

      expect(view).toContain("<table")
      // React renders camelCase attributes as-is in HTML
      expect(view).toContain('cellPadding="0"')
      expect(view).toContain('cellSpacing="0"')
      expect(view).toContain("Cell 1")
      expect(view).toContain("Cell 2")
    })
  })
})
