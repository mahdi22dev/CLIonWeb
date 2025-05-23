import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import * as os from 'node:os';
import * as pty from '@lydell/node-pty';

interface CommandPayload {
  clientID: number;
  command: string;
}

@WebSocketGateway()
export class TerminalGateway {
  @WebSocketServer()
  server: Server;
  private terminal = new Map<number, { clientID: number; process: pty.IPty }>();
  private command: string;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.terminal.clear();
  }

  @SubscribeMessage('executeCommand')
  handleCommand(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CommandPayload,
  ) {
    try {
      const { clientID: id, command } = payload;
      this.command = command;
      let child: pty.IPty = this.terminal.get(id)?.process;

      if (!child) {
        const bashPath = 'C:/Program Files/Git/bin/bash.exe';
        const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
        const args =
          shell === 'bash'
            ? ['-c', 'stty -echo; exec bash']
            : [
                '-NoLogo', // Removes PowerShell startup banner
                '-NoProfile', // Prevents loading user profile (faster + cleaner)
                '-ExecutionPolicy',
                'Bypass', // Bypass script restrictions (safe in sandbox)
                '-Command',
                '-', // Accept commands via stdin (interactive)
              ];
        child = pty?.spawn(shell, args, {
          name: 'xterm-256color',
          cols: 80,
          rows: 30,
          cwd: process.env.HOME,
          env: {
            ...process.env,
            TERM: 'xterm-256color',
          },
        });

        this.terminal.set(id, { clientID: id, process: child });
      }

      if (child) {
        child.onExit(() => {
          child.kill();
          this.terminal.delete(id);
        });
      }

      child.write(`${command}\r`);
    } catch (err) {
      console.error('WebSocket Error:', err);
      client.emit('error', { message: 'Command execution failed' });
    }
  }

  @SubscribeMessage('createTerminal')
  async handleTerminalCreation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { id: number },
  ) {
    try {
      const { id } = payload;
      const existingTerminal = this.terminal.get(id);
      if (existingTerminal) {
        return;
      }
      const bashPath = 'C:/Program Files/Git/bin/bash.exe';
      const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
      let unsentData = '';
      const args =
        shell === 'bash'
          ? ['-c', 'stty -echo; exec bash']
          : [
              '-NoLogo',
              '-NoProfile',
              '-ExecutionPolicy',
              'Bypass',
              '-Command',
              '-',
            ];

      const child = pty?.spawn(shell, args, {
        name: 'xterm-256color',
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
        },
      });
      child && this.terminal.set(id, { clientID: id, process: child });

      child.onData((data) => {
        unsentData += data;
        client.emit('commandOutput', { id, data });
      });

      // remove this write better code
      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
      // remove this write better code

      return {
        id,
        pid: this.terminal.get(id)?.process.pid,
        prompt: unsentData,
      };
    } catch (err) {
      console.error('WebSocket Error:', err);
      client.emit('error', { message: 'Failed to create a terminal' });
    }
  }
}
