import { Module } from '@nestjs/common';
import { TerminalService } from './terminal.service';
import { TerminalGateway } from './terminal.gateway';

@Module({
  providers: [TerminalGateway, TerminalService],
})
export class TerminalModule {}
