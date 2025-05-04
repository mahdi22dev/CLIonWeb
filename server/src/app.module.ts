import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TerminalModule } from './terminal/terminal.module';

@Module({
  imports: [TerminalModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
