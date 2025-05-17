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
  private clientProcesses = new Map<string, any>();
  private terminal = new Map<number, { clientID: number; process: pty.IPty }>();

  // handleConnection(client: Socket) {
  //   console.log(`Client connected: ${client.id}`);
  // }

  // handleDisconnect(client: Socket) {
  //   console.log(`Client disconnected: ${client.id}`);
  //   const child = this.clientProcesses.get(client.id);
  //   // if (child) {
  //   //   child.kill();
  //   //   this.clientProcesses.delete(client.id);
  //   // }
  // }

  @SubscribeMessage('executeCommand')
  handleCommand(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CommandPayload,
  ) {
    try {
      const { id, command } = payload;
      let child: pty.IPty = this.terminal.get(id)?.process;

      // Spawn PTY only once per client
      if (!child) {
        console.log('Creating a new child process');
        const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

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

        this.clientProcesses.set(client.id, child);

        if (child) {
          child.onData((data) => {
            console.log(data);
            client.emit('commandOutput', { id, data }); // Stream output
          });

          child.onExit(() => {
            child.kill();
            this.clientProcesses.delete(client.id); // Cleanup
          });
        } else {
          console.log('Child is null');
        }
      }

      child.write(`${command}\n`);
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
      const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
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

      child.onData((data) => {
        console.log('pty output:', data);
        unsentData += data;
        this.terminal.set(id, { clientID: id, process: child });

        // client.emit('terminalPID', {
        //   id,
        //   pid: this.terminal.get(id).process.pid,
        //   data: data,
        // });
      });
      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });

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
