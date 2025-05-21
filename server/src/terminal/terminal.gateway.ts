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
  id: number;
  command: string;
}

@WebSocketGateway()
export class TerminalGateway {
  @WebSocketServer()
  server: Server;
  private terminal = new Map<number, { clientID: number; process: pty.IPty }>();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('executeCommand')
  handleCommand(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CommandPayload,
  ) {
    try {
      const { id, command } = payload;
      let child: pty.IPty = this.terminal.get(id)?.process;
      console.log('child:', child?.pid);
      // Spawn PTY only once per client
      if (!child) {
        const bashPath = 'C:/Program Files/Git/bin/bash.exe';
        const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
        const config = { using: 'bash', shell: bashPath };
        child = pty?.spawn(shell, [], {
          name: 'xterm-256color',
          cols: 80,
          rows: 30,
          cwd: process.env.HOME,
          env: {
            ...process.env,
            TERM: 'xterm-256color',
          },
        });
        console.log(
          "we spawned new child because we didn't found one:",
          child.pid,
        );
        this.terminal.set(id, { clientID: id, process: child });
      }

      if (child) {
        child.onData((data) => {
          client.emit('commandOutput', { id, data });
        });

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
        console.log('Terminal already exists:', existingTerminal);
        return {
          id,
          pid: existingTerminal.process.pid,
          prompt: existingTerminal.process,
        };
      }
      const bashPath = 'C:/Program Files/Git/bin/bash.exe';
      const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
      const config = { using: 'bash', shell: bashPath };
      let unsentData = '';
      const child = pty?.spawn(shell, [], {
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

      child.onData((data) => {
        console.log('pty first output:', data);
        unsentData += data;
      });
      // remove this write better code
      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
      console.log('created child:', child.pid);
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
