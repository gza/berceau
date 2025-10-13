import { Controller, Get } from "@nestjs/common"
import { createElement } from "react"
import { renderPage } from "../../ssr/renderPage"
import { AboutPage } from "./ui/AboutPage"

@Controller()
export class AboutController {
  @Get("/about")
  getAbout(): string {
    return renderPage(createElement(AboutPage), {
      title: "About",
      currentPath: "/about",
    })
  }
}
