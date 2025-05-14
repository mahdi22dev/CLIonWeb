import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({ origin: 'http://localhost:3000' });

  await app
    .listen(3001)
    .then(() => {
      console.log('Server is running on http://localhost:3001');
    })
    .catch((err) => {
      console.log('Error starting server:', err);
    });
}
bootstrap();
