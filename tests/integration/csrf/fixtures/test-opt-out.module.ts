import { Module } from "@nestjs/common"
import { TestOptOutController } from "./test-opt-out.controller"
import { TestOptOutClassController } from "./test-opt-out-class.controller"

@Module({
  controllers: [TestOptOutController, TestOptOutClassController],
})
export class TestOptOutModule {}
