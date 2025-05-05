import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TerminalModule } from './terminal/terminal.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [TerminalModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
