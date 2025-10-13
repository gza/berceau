import { Controller, Get } from "@nestjs/common"
import { createElement } from "react"
import { renderPage } from "../../ssr/renderPage"
import { WelcomePage } from "../welcome/ui/WelcomePage"

@Controller()
export class PagesController {
  @Get("/")
  getWelcome(): string {
    return renderPage(createElement(WelcomePage), {
      title: "Welcome",
      currentPath: "/",
    })
  }
}
