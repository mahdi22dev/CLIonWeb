import { Module } from '@nestjs/common';
import { TerminalService } from './terminal.service';
import { TerminalGateway } from './terminal.gateway-no-pty';

@Module({
  providers: [TerminalGateway, TerminalService],
})
export class TerminalModule {}
