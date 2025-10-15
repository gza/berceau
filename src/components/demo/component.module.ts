/**
 * Demo Component Module
 */

import { Module } from "@nestjs/common"
import { DemoController } from "./component.controller"

@Module({
  controllers: [DemoController],
})
export class DemoComponentModule {}
