import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as os from 'node:os';
import * as pty from 'node-pty';

interface CommandPayload {
  id: number;
  command: string;
}

interface DataPayload {
  id: number;
  data: string;
}

@WebSocketGateway({ cors: true })
export class TerminalGateway {
  @WebSocketServer()
  server: Server;
  private clientTerminals = new Map<string, pty.IPty>();
  private clientBuffers = new Map<string, string>();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const terminal = this.clientTerminals.get(client.id);
    if (terminal) {
      terminal.kill();
      this.clientTerminals.delete(client.id);
      this.clientBuffers.delete(client.id);
    }
  }

  @SubscribeMessage('executeCommand')
  handleCommand(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CommandPayload,
  ) {
    try {
      const { id, command } = payload;
      let terminal = this.clientTerminals.get(client.id);
      let buffer = this.clientBuffers.get(client.id) || '';
      if (!terminal) {
        const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

        // Set environment with standardized prompt
        const env = {
          ...process.env,
          PS1: '__TERMINAL_READY__$ ', // Simple, easily detectable prompt
          TERM: 'xterm-256color',
        };

        terminal = pty.spawn(shell, ['--noprofile', '--norc'], {
          name: 'xterm-256color',
          cwd: process.env.HOME,
          env: env,
        });

        this.clientTerminals.set(client.id, terminal);
        this.clientBuffers.set(client.id, '');

        terminal.onData((data) => {
          buffer += data;
          this.clientBuffers.set(client.id, buffer);

          client.emit('commandOutput', { id, data });

          // Look for our custom prompt
          if (buffer.includes('__TERMINAL_READY__$ ')) {
            console.log('Shell ready for new commands');
            buffer = '';
            this.clientBuffers.set(client.id, buffer);
          }
        });

        terminal.onExit(({ exitCode, signal }) => {
          console.log(`Terminal exited with code ${exitCode}`);
          this.clientTerminals.delete(client.id);
          this.clientBuffers.delete(client.id);
        });
      }

      // Send command (with newline to execute)
      terminal.write(`${command}\n`);
    } catch (err) {
      console.error('WebSocket Error:', err);
      client.emit('commandOutput', {
        id: payload.id,
        error: 'Command execution failed',
        message: err.message,
      });
    }
  }
}
