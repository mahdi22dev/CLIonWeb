import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { spawn } from 'child_process';
import { cwd } from 'node:process';

interface CommandPayload {
  id: number;
  command: string;
}

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
    @MessageBody() payload: CommandPayload,
  ) {
    const { id, command } = payload;

    console.log(`Received command: ${command} from command id: ${id}`);
    console.log(`Current directory: ${cwd()}`);

    const [cmd, ...args] = command.trim().split(' ');

    try {
      const child = spawn(cmd, args, {
        shell: true,
      });

      child.stdout.on('data', (data) => {
        console.log(data.toString());
        client.emit('commandOutput', {
          id,
          data: data.toString(),
        });
      });

      child.stderr.on('data', (data) => {
        console.log(data.toString());
        client.emit('commandOutput', {
          id,
          data: data.toString(),
        });
      });

      child.on('close', (code) => {
        client.emit('commandOutput', {
          id,
          data: `\nProcess exited with code ${code}`,
        });
      });

      child.on('error', (err) => {
        client.emit('commandOutput', {
          id,
          data: `\nError: ${err.message}`,
        });
      });
    } catch (err: any) {
      client.emit('commandOutput', {
        id,
        data: `\nException: ${err.message}`,
      });
    }
  }
}
