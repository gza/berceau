import { Controller, Post, Body } from "@nestjs/common"
import { SkipCsrf } from "../../../../src/csrf"

/**
 * Test controller with @SkipCsrf() on entire class
 */
@Controller("test-csrf-opt-out-class")
@SkipCsrf()
export class TestOptOutClassController {
  // All methods in this class should skip CSRF validation
  @Post("api/endpoint1")
  endpoint1(@Body() data: { name: string }) {
    return { success: true, endpoint: 1, data }
  }

  @Post("api/endpoint2")
  endpoint2(@Body() data: { name: string }) {
    return { success: true, endpoint: 2, data }
  }
}
