/**
 * Unit Tests for <CsrfToken /> Component
 *
 * Feature: 003-provide-an-easy
 * User Story 3: JSX Component for Forms
 * Date: 2025-10-26
 *
 * Tests for CSRF token component rendering during SSR.
 * Following TDD approach - these tests are written before implementation.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */ // Required for mocking context with `any` types in test setup.
/* eslint-disable @typescript-eslint/no-explicit-any */ // Required for mocking context with `any` types in test setup.
/* eslint-disable @typescript-eslint/unbound-method */ // Required for accessing unbound methods for Jest mocks.
/* eslint-disable testing-library/no-node-access */ // Required for testing DOM structure directly with querySelector and node access.
/* eslint-disable testing-library/no-container */ // Required for testing DOM structure directly with querySelector and container access.

import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import { CsrfToken } from "../csrf-token.component"
import { CsrfService } from "../csrf.service"
import * as csrfContext from "../csrf-context"

// Mock the context module
jest.mock("../csrf-context")

describe("CsrfToken Component", () => {
  let mockService: jest.Mocked<CsrfService>
  let mockGetRequestContext: jest.MockedFunction<
    typeof csrfContext.getRequestContext
  >

  beforeEach(() => {
    // Create mock service
    mockService = {
      generateToken: jest.fn(),
      getToken: jest.fn(),
      getFieldName: jest.fn(),
      getHeaderName: jest.fn(),
    } as unknown as jest.Mocked<CsrfService>

    // Mock the getRequestContext function
    mockGetRequestContext =
      csrfContext.getRequestContext as jest.MockedFunction<
        typeof csrfContext.getRequestContext
      >
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("Standard Rendering", () => {
    it("should render hidden input with token value", () => {
      const mockSession = {}
      const mockRequest = { session: mockSession } as any
      const testToken = "abc123def456789"

      // Setup mocks
      mockGetRequestContext.mockReturnValue({
        request: mockRequest,
        service: mockService,
      })
      mockService.generateToken.mockReturnValue(testToken)
      mockService.getFieldName.mockReturnValue("_csrf")

      // Render component
      render(<CsrfToken />)

      // Verify hidden input is rendered
      const input = screen.getByTestId("csrf-token")
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute("type", "hidden")
      expect(input).toHaveAttribute("name", "_csrf")
      expect(input).toHaveValue(testToken)
    })

    it("should call generateToken with session from context", () => {
      const mockSession = { _csrf: "existing-token" }
      const mockRequest = { session: mockSession } as any

      mockGetRequestContext.mockReturnValue({
        request: mockRequest,
        service: mockService,
      })
      mockService.generateToken.mockReturnValue("existing-token")
      mockService.getFieldName.mockReturnValue("_csrf")

      render(<CsrfToken />)

      expect(mockService.generateToken).toHaveBeenCalledWith(mockSession)
      expect(mockService.generateToken).toHaveBeenCalledTimes(1)
    })

    it("should use default data-testid if not provided", () => {
      const mockSession = {}
      const mockRequest = { session: mockSession } as any

      mockGetRequestContext.mockReturnValue({
        request: mockRequest,
        service: mockService,
      })
      mockService.generateToken.mockReturnValue("token123")
      mockService.getFieldName.mockReturnValue("_csrf")

      render(<CsrfToken />)

      const input = screen.getByTestId("csrf-token")
      expect(input).toBeInTheDocument()
    })
  })

  describe("Custom Props", () => {
    it("should accept custom fieldName prop", () => {
      const mockSession = {}
      const mockRequest = { session: mockSession } as any

      mockGetRequestContext.mockReturnValue({
        request: mockRequest,
        service: mockService,
      })
      mockService.generateToken.mockReturnValue("token123")

      render(<CsrfToken fieldName="csrf_token" />)

      const input = screen.getByTestId("csrf-token")
      expect(input).toHaveAttribute("name", "csrf_token")
    })

    it("should accept custom id prop", () => {
      const mockSession = {}
      const mockRequest = { session: mockSession } as any

      mockGetRequestContext.mockReturnValue({
        request: mockRequest,
        service: mockService,
      })
      mockService.generateToken.mockReturnValue("token123")
      mockService.getFieldName.mockReturnValue("_csrf")

      render(<CsrfToken id="my-csrf-token" />)

      const input = screen.getByTestId("csrf-token")
      expect(input).toHaveAttribute("id", "my-csrf-token")
    })

    it("should accept custom data-testid prop", () => {
      const mockSession = {}
      const mockRequest = { session: mockSession } as any

      mockGetRequestContext.mockReturnValue({
        request: mockRequest,
        service: mockService,
      })
      mockService.generateToken.mockReturnValue("token123")
      mockService.getFieldName.mockReturnValue("_csrf")

      render(<CsrfToken data-testid="custom-csrf" />)

      const input = screen.getByTestId("custom-csrf")
      expect(input).toBeInTheDocument()
    })

    it("should use getFieldName() when fieldName prop not provided", () => {
      const mockSession = {}
      const mockRequest = { session: mockSession } as any

      mockGetRequestContext.mockReturnValue({
        request: mockRequest,
        service: mockService,
      })
      mockService.generateToken.mockReturnValue("token123")
      mockService.getFieldName.mockReturnValue("_csrf")

      render(<CsrfToken />)

      expect(mockService.getFieldName).toHaveBeenCalled()
      const input = screen.getByTestId("csrf-token")
      expect(input).toHaveAttribute("name", "_csrf")
    })
  })

  describe("Error Handling", () => {
    it("should return null when request context is not available", () => {
      mockGetRequestContext.mockReturnValue(null)

      const { container } = render(<CsrfToken />)

      // Should render nothing (null)
      expect(container.children.length).toBe(0)
    })

    it("should return null when session is not available in request", () => {
      const mockRequest = {} as any // No session property

      mockGetRequestContext.mockReturnValue({
        request: mockRequest,
        service: mockService,
      })

      const { container } = render(<CsrfToken />)

      // Should render nothing (null)
      expect(container.children.length).toBe(0)
    })

    it("should handle missing context gracefully for test environments", () => {
      mockGetRequestContext.mockReturnValue(null)

      const { container } = render(<CsrfToken />)

      // Should not throw, just return null
      expect(container.children.length).toBe(0)
    })
  })

  describe("HTML Structure", () => {
    it("should render correct HTML element structure", () => {
      const mockSession = {}
      const mockRequest = { session: mockSession } as any

      mockGetRequestContext.mockReturnValue({
        request: mockRequest,
        service: mockService,
      })
      mockService.generateToken.mockReturnValue("token123")
      mockService.getFieldName.mockReturnValue("_csrf")

      const { container } = render(<CsrfToken />)

      const input = container.querySelector('input[type="hidden"]')
      expect(input).toBeInTheDocument()
      expect(input?.getAttribute("type")).toBe("hidden")
      expect(input?.getAttribute("name")).toBe("_csrf")
      expect(input?.getAttribute("value")).toBe("token123")
    })

    it("should not render any wrapper elements", () => {
      const mockSession = {}
      const mockRequest = { session: mockSession } as any

      mockGetRequestContext.mockReturnValue({
        request: mockRequest,
        service: mockService,
      })
      mockService.generateToken.mockReturnValue("token123")
      mockService.getFieldName.mockReturnValue("_csrf")

      const { container } = render(<CsrfToken />)

      // Should only have one input element, no wrappers
      expect(container.children.length).toBe(1)
      expect(container.children[0].tagName).toBe("INPUT")
    })

    it("should render input with all custom props applied", () => {
      const mockSession = {}
      const mockRequest = { session: mockSession } as any

      mockGetRequestContext.mockReturnValue({
        request: mockRequest,
        service: mockService,
      })
      mockService.generateToken.mockReturnValue("abc123")
      mockService.getFieldName.mockReturnValue("_csrf")

      const { container } = render(
        <CsrfToken
          fieldName="custom_field"
          id="custom-id"
          data-testid="custom-testid"
        />,
      )

      const input = container.querySelector("input")
      if (input == null) throw new Error("Input element not found")
      expect(input.type).toBe("hidden")
      expect(input.name).toBe("custom_field")
      expect(input.id).toBe("custom-id")
      expect(input.value).toBe("abc123")
      expect(input).toHaveAttribute("data-testid", "custom-testid")
    })
  })

  describe("Integration with CsrfService", () => {
    it("should use service from context to generate token", () => {
      const mockSession = {}
      const mockRequest = { session: mockSession } as any

      mockGetRequestContext.mockReturnValue({
        request: mockRequest,
        service: mockService,
      })
      mockService.generateToken.mockReturnValue("generated-token")
      mockService.getFieldName.mockReturnValue("_csrf")

      render(<CsrfToken />)

      expect(mockService.generateToken).toHaveBeenCalledWith(mockSession)

      const input = screen.getByTestId("csrf-token")
      expect(input).toHaveValue("generated-token")
    })

    it("should handle token generation errors gracefully", () => {
      const mockSession = {}
      const mockRequest = { session: mockSession } as any

      mockGetRequestContext.mockReturnValue({
        request: mockRequest,
        service: mockService,
      })
      mockService.generateToken.mockImplementation(() => {
        throw new Error("Token generation failed")
      })

      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {})

      expect(() => render(<CsrfToken />)).toThrow("Token generation failed")

      consoleError.mockRestore()
    })
  })
})
