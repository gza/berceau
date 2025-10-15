import { Controller, Get, HttpCode } from "@nestjs/common"
import { createElement } from "react"
import { renderPage } from "../../ssr/renderPage"
import { NotFoundPage } from "./ui/NotFoundPage"

@Controller()
export class ErrorsController {
  @Get("*")
  @HttpCode(404)
  getNotFound(): string {
    return renderPage(createElement(NotFoundPage), {
      title: "Not Found",
    })
  }
}
