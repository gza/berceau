import { Module } from "@nestjs/common"
import { AboutController } from "./example.controller"

@Module({
  controllers: [AboutController],
})
export class AboutModule {}
