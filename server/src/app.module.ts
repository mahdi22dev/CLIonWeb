import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WsService } from './ws/ws.service';
import { WsModule } from './ws/ws.module';

@Module({
  imports: [WsModule],
  controllers: [AppController],
  providers: [AppService, WsService],
})
export class AppModule {}
