import { Module } from "@nestjs/common"
import { AboutModule } from "./systemComponents/about/about.module"
import { ErrorsModule } from "./systemComponents/errors/errors.module"
import { CoreModule } from "./systemComponents/core/core.module"
import { GeneratedComponentsModule } from "./components.generated/generated-components.module"
import { CsrfModule } from "./csrf/csrf.module"
import { DatabaseModule } from "./database/runtime/database.module"
import { BenchmarkModule } from "./components/benchmark/benchmark.module"

@Module({
  imports: [
    // Global database module (provides PrismaService globally)
    DatabaseModule,
    // Global CSRF protection module
    CsrfModule.forRoot(),
    // System modules (specific routes first)
    CoreModule,
    AboutModule,
    // Benchmark endpoints (for performance testing)
    BenchmarkModule,
    // Dynamically discovered feature modules
    GeneratedComponentsModule,
    // Error handler with wildcard (must be last)
    ErrorsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
