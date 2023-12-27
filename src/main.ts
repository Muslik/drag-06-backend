import { fastifyCookie } from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import { LogLevel } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SpelunkerModule } from 'nestjs-spelunker';

import { AppModule } from './app.module';
import { NODE_ENV } from './config';
import { ACCESS_TOKEN, SESSION_ID } from './infrastructure/decorators/auth.decorator';

const getLoggerType = (): LogLevel[] => {
  if (NODE_ENV === 'production') {
    return ['warn', 'error', 'log'];
  }

  return ['debug', 'log', 'verbose', 'error', 'warn'];
};

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    logger: getLoggerType(),
  });
  /* const tree = SpelunkerModule.explore(app); */
  /* const root = SpelunkerModule.graph(tree); */
  /* const edges = SpelunkerModule.findGraphEdges(root); */
  /* const mermaidEdges = edges.map(({ from, to }) => `  ${from.module.name}-->${to.module.name}`); */
  /* console.log(mermaidEdges.join('\n')); */
  const config = new DocumentBuilder()
    .setTitle('Drag06 API')
    .setDescription('This api for drag06')
    .setVersion('1.0')
    .addTag('auth')
    .addCookieAuth(SESSION_ID, {
      type: 'apiKey',
      name: SESSION_ID,
      in: 'Cookie',
    })
    .addBearerAuth(
      {
        bearerFormat: 'JWT',
        scheme: 'Bearer',
        type: 'http',
        in: 'Header',
      },
      ACCESS_TOKEN,
    )
    .build();
  await app.register(fastifyCookie);
  await app.register(fastifyCors, { origin: true, credentials: true });
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(9000);
}
bootstrap();
