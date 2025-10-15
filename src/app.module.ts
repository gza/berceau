import { Module } from "@nestjs/common"
import { AboutModule } from "./systemComponents/about/about.module"
import { ErrorsModule } from "./systemComponents/errors/errors.module"
import { CoreModule } from "./systemComponents/core/core.module"
import { GeneratedFeaturesModule } from "./components.generated/generated-features.module"

@Module({
  imports: [
    // System modules (specific routes first)
    CoreModule,
    AboutModule,
    // Dynamically discovered feature modules
    GeneratedFeaturesModule,
    // Error handler with wildcard (must be last)
    ErrorsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
