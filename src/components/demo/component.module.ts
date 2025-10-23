/**
 * Demo Component Module
 */

import { Module } from "@nestjs/common"
import { DemoController } from "./component.controller"
import { DemoComponentService } from "./component.service"

@Module({
  controllers: [DemoController],
  providers: [DemoComponentService],
  exports: [DemoComponentService],
})
export class DemoComponentModule {}
