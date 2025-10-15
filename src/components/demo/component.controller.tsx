/**
 * Demo Component Controller
 */

import { Controller, Get, Res } from "@nestjs/common"
import type { Response } from "express"
import { renderPage } from "../../ssr/renderPage"
import { DemoPage } from "./ui/DemoPage"

@Controller()
export class DemoController {
  @Get("/demo")
  demo(@Res() res: Response) {
    const view = renderPage(<DemoPage title="Demo" />, {
      title: "Demo - Component Example",
      currentPath: "/demo",
    })
    res.status(200).send(view)
  }
}
