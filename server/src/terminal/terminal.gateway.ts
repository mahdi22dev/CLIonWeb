import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { spawn } from 'child_process';
import os from 'os';
import { cwd } from 'node:process';

@WebSocketGateway({ cors: true })
export class TerminalGateway {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('executeCommand')
  handleCommand(
    @ConnectedSocket() client: Socket,
    @MessageBody() command: string,
  ) {
    console.log(`Received command: ${command} from client: ${client.id}`);

    // Split the command into the executable and its arguments
    const [cmd, ...args] = command.trim().split(' ');

    try {
      const child = spawn(cmd, args, {
        shell: true,
      });

      console.log(`Current directory: ${cwd()}`);

      // Stream standard output
      child.stdout.on('data', (data) => {
        client.emit('commandOutput', data.toString());
      });

      // Stream standard error
      child.stderr.on('data', (data) => {
        client.emit('commandOutput', data.toString());
      });

      // Handle process exit
      child.on('close', (code) => {
        client.emit('commandOutput', `\nProcess exited with code ${code}`);
      });

      // Handle errors during spawning
      child.on('error', (err) => {
        client.emit('commandOutput', `\nError: ${err.message}`);
      });
    } catch (err) {
      client.emit('commandOutput', `\nException: ${err.message}`);
    }
  }
}
