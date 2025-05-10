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

@WebSocketGateway({ cors: true })
export class TerminalGateway {
  @WebSocketServer()
  server: Server;
  private clientProcesses = new Map<string, any>();
  private terminal: pty.IPty; // Should be your terminal type (e.g., pty.Pty)

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const child = this.clientProcesses.get(client.id);
    // if (child) {
    //   child.kill();
    //   this.clientProcesses.delete(client.id);
    // }
  }

  @SubscribeMessage('executeCommand')
  handleCommand(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CommandPayload,
  ) {
    try {
      const { id, command } = payload;
      let child: pty.IPty = this.clientProcesses.get(client.id);

      // Spawn PTY only once per client
      if (!child) {
        const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
        console.log('shell', shell);

        child = pty?.spawn('bash', [], {
          name: 'xterm-color',
          cols: 80,
          rows: 30,
          cwd: process.env.HOME,
          env: process.env,
        });

        this.clientProcesses.set(client.id, child);

        if (child) {
          child.onData((data) => {
            process.stdout.write(data); // Observe prompt after command output
          });

          // child.write('ls\r'); // Triggers output + prompt

          child.onData((data) => {
            console.log(data);

            client.emit('commandOutput', { id, data }); // Stream output
          });

          child.onExit(() => {
            child.kill();
            this.clientProcesses.delete(client.id); // Cleanup
          });
        } else {
          console.log('child is null');
        }
      }

      child.write(`${command}\n`); // Send command + newline
    } catch (err) {
      console.error('WebSocket Error:', err);
      client.emit('error', { message: 'Command execution failed' });
    }
  }
}
