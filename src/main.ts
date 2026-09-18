/**
 * ==============================================================================================
 * 🟢 STEP 1 of 11: APPLICATION ENTRY POINT (BOOTSTRAP)
 * ==============================================================================================
 * Start here! This file boots the NestJS HTTP server and WebSocket Gateway.
 *
 * What happens here:
 *  1.1: Creates the NestJS application instance from AppModule.
 *  1.2: Enables CORS so any browser client (e.g. client/index.html) can connect to WebSockets.
 *  1.3: Registers global ValidationPipe to automatically validate incoming WebSocket DTO payloads.
 *  1.4: Listens on PORT 3000.
 *
 * 👉 NEXT STEP: Open "src/app.module.ts" (STEP 2 of 11) to see how modules are assembled.
 * ==============================================================================================
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // 1.1: Create NestJS App
  const app = await NestFactory.create(AppModule);

  // 1.2: Enable CORS for both HTTP and WebSockets
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 1.3: Enable Global Validation for all DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // 1.4: Start listening on port 3000
  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 NestJS Server & WebSocket Gateway running on http://localhost:${port}`);
  logger.log(`📡 Open client/index.html in your browser to test real-time chat!`);
}

// Top-level await starts the server in ESM
await bootstrap();
