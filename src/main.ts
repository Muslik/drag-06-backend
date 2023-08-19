import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { NODE_ENV } from './config';
import { ValidationException } from './libs/exceptions';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    logger: NODE_ENV === 'production' ? ['warn', 'error', 'log'] : ['debug', 'log', 'verbose', 'error', 'warn'],
  });
  const config = new DocumentBuilder()
    .setTitle('Drag06 API')
    .setDescription('This api for drag06')
    .setVersion('1.0')
    .addTag('auth')
    .build();
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors) => new ValidationException(errors),
    })
  );
  app.register(fastifyCookie);
  app.register(fastifyCors, { origin: true, credentials: true });
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(9000);
}
bootstrap();
