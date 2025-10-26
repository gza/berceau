import { Controller, Post, Body, HttpCode } from "@nestjs/common"
import { SkipCsrf } from "../../csrf"

/**
 * Benchmark Controller for CSRF Performance Testing
 *
 * Provides endpoints for measuring CSRF protection overhead.
 */
@Controller("api/benchmark")
export class BenchmarkController {
  /**
   * Endpoint without CSRF protection (baseline)
   *
   * Used to measure baseline POST request latency.
   */
  @Post("no-csrf")
  @HttpCode(200) // Return 200 instead of 201
  @SkipCsrf()
  noCsrf(@Body() data: { data: string }) {
    return { success: true, data: data.data }
  }

  /**
   * Endpoint with CSRF protection (default)
   *
   * Used to measure POST request latency with CSRF validation.
   */
  @Post("with-csrf")
  @HttpCode(200) // Return 200 instead of 201
  withCsrf(@Body() data: { _csrf?: string; data: string }) {
    return { success: true, data: data.data }
  }
}
