import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as os from 'node:os';
import { spawn, ChildProcess } from 'child_process';

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
  private clientProcesses = new Map<string, ChildProcess>();

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
      let child: ChildProcess = this.clientProcesses.get(client.id);

      // Spawn child process only once per client
      if (!child) {
        const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
        console.log('platform', shell);

        child = spawn(shell, [], {
          shell: true,
          stdio: 'pipe',
          cwd: process.env.HOME,
          env: process.env,
        });

        // this.clientProcesses.set(client.id, child);
        console.log(child);
        if (child) {
          // Handle stdout data
          child.stdout.on('data', (data) => {
            console.log(data.toString());
            client.emit('commandOutput', { id, data: data.toString() }); // Stream output
          });

          // Handle stderr data
          child.stderr.on('data', (data) => {
            console.error(`Error: ${data.toString()}`);
            client.emit('commandError', { id, error: data.toString() }); // Stream error output
          });

          // Handle process exit
          child.on('exit', (code) => {
            console.log(`Child process exited with code ${code}`);
            this.clientProcesses.delete(client.id); // Cleanup
          });

          // Handle process errors
          child.on('error', (err) => {
            console.error(`Child process error: ${err.message}`);
            client.emit('commandError', { id, error: err.message });
          });
        }
      }

      child.stdin.write(`${command}\n`); // Send command + newline
    } catch (err) {
      console.error('WebSocket Error:', err);
      client.emit('error', { message: 'Command execution failed' });
    }
  }
}
