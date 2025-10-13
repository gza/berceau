import { Logger } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const logger = new Logger("Bootstrap")

  // In production, you would integrate Vite as middleware here
  // For development, we'll use the simple SSR approach
  if (process.env.NODE_ENV !== "production") {
    // Development mode - Vite middleware would go here
    logger.log("Running in development mode")
  }

  const port = 3000
  await app.listen(port)
  logger.log(`Application is running on: http://localhost:${port}`)
}
bootstrap().catch((error) => {
  const logger = new Logger("Bootstrap")
  if (error instanceof Error) {
    logger.error("Failed to start application", error.stack)
  } else {
    logger.error("Failed to start application due to unknown error")
  }
  process.exit(1)
})