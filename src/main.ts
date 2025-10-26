import { Logger } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { NestExpressApplication } from "@nestjs/platform-express"
import session from "express-session"
import { join } from "path"
import { AppModule } from "./app.module"

// Declare module for Hot Module Replacement
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const module: any

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const logger = new Logger("Bootstrap")

  // Configure session middleware for CSRF protection
  app.use(
    session({
      secret:
        process.env.SESSION_SECRET ||
        "fallback-dev-secret-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    }),
  )

  // Serve static assets from dist/assets/ at /assets/ URL
  app.useStaticAssets(join(__dirname, "assets"), {
    prefix: "/assets/",
  })

  // In production, you would integrate Vite as middleware here
  // For development, we'll use the simple SSR approach
  if (process.env.NODE_ENV !== "production") {
    // Development mode - Vite middleware would go here
    logger.log("Running in development mode")
  }

  const port = 3000
  await app.listen(port)
  logger.log(`Application is running on: http://localhost:${port}`)

  // Hot Module Replacement
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (module.hot) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    module.hot.accept()

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    module.hot.dispose(() => app.close())
  }
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
