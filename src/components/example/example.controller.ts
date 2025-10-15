import { Controller, Get } from "@nestjs/common"
import { createElement } from "react"
import { renderPage } from "../../ssr/renderPage"
import { ExamplePage } from "./ui/ExamplePage"

@Controller()
export class AboutController {
  @Get("/about")
  getAbout(): string {
    return renderPage(createElement(ExamplePage), {
      title: "About",
      currentPath: "/about",
    })
  }
}
