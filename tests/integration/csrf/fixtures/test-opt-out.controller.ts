import { Controller, Post, Body } from "@nestjs/common"
import { SkipCsrf } from "../../../../src/csrf"

/**
 * Test controller with @SkipCsrf() on individual methods
 */
@Controller("test-csrf-opt-out")
export class TestOptOutController {
  // API endpoint with @SkipCsrf() on method
  @Post("api/data")
  @SkipCsrf()
  createApiData(@Body() data: { name: string }) {
    return { success: true, data }
  }

  // Protected endpoint without @SkipCsrf()
  @Post("protected")
  createProtectedData(@Body() data: { name: string }) {
    return { success: true, data }
  }
}
