import { Module } from "@nestjs/common"
import { AboutModule } from "./components/about/about.module"
import { ErrorsModule } from "./components/errors/errors.module"
import { CoreModule } from "./components/core/core.module"

@Module({
  imports: [AboutModule, CoreModule, ErrorsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}