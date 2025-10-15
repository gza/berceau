/**
 * Demo Feature Module
 */

import { Module } from "@nestjs/common"
import { DemoController } from "./feature.controller"

@Module({
  controllers: [DemoController],
})
export class DemoFeatureModule {}
