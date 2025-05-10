"use client";
import React, { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { FitAddon } from "@xterm/addon-fit";
import { Socket } from "socket.io-client";

interface TerminalProps {
  PROMPT?: string;
  socket: Socket | undefined;
}

interface DataPayload {
  id: number;
  data: string;
}
const Xtrem = ({ PROMPT = "$mahdi@xtrem:~$ ", socket }: TerminalProps) => {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const term = useRef<Terminal | null>(null);
  const inputBuffer = useRef<string>("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentCommand, setCurrentCommand] = useState<DataPayload>();
  // const PROMPT = "$mahdi@xtrem:~$ ";

  const prompt = () => {
    term.current?.write(PROMPT);
  };
  useEffect(() => {
    if (!socket) return;
    if (!term.current) return;

    socket?.on("commandOutput", (data: DataPayload) => {
      console.log(data);
      term.current?.write("\r\n");
      if (data.data) {
        term.current?.write(data.data.toString());
      }
      // prompt();
    });
    return () => {
      socket.off("commandOutput", () => {});
    };
  }, []);

  const handleCommand = (command: string) => {
    if (!term.current) return;

    setCommandHistory((prev) => {
      const updatedHistory = [...prev, command];
      console.log("Updated command history:", updatedHistory);
      return updatedHistory;
    });

    switch (command) {
      case "help":
        term.current.writeln("Available commands: help, clear, echo [text]");
        break;
      case "clear":
        term.current.clear();
        prompt();
        break;
      default:
        if (command.startsWith("echo ")) {
          term.current.writeln(command.slice(5));
        } else if (command.length > 0) {
          const id = Date.now();
          const cmd = { id: id, data: command };
          setCurrentCommand(cmd);

          socket?.emit("executeCommand", { id, command });
          // term.current.writeln(`Command not found: ${command}`);
        }
    }
  };

  useEffect(() => {
    if (!socket) return;
    if (!terminalRef.current) return;
    const fitAddon = new FitAddon();
    term.current = new Terminal({
      cursorBlink: true,
      fontSize: 16,
      theme: {
        background: "#300A24",
        foreground: "#FFFFFF",
        black: "#2E3436",
        red: "#CC0000",
        green: "#4E9A06",
        yellow: "#C4A000",
        blue: "#3465A4",
        magenta: "#75507B",
        cyan: "#06989A",
        white: "#D3D7CF",
        brightBlack: "#555753",
        brightRed: "#EF2929",
        brightGreen: "#8AE234",
        brightYellow: "#FCE94F",
        brightBlue: "#729FCF",
        brightMagenta: "#AD7FA8",
        brightCyan: "#34E2E2",
        brightWhite: "#EEEEEC",
      },
    });
    term.current.loadAddon(fitAddon);
    term.current.open(terminalRef.current);
    fitAddon.fit();

    term.current?.onData((data) => {
      const code = data.charCodeAt(0);
      // Handle Arrow Keys
      if (data === "\u001b[A") {
        // Arrow Up
        if (historyIndex < commandHistory.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          term.current?.write("\r\n");
          term.current?.writeln(
            commandHistory[commandHistory.length - 1 - newIndex]
          );
        }
      } else if (data === "\u001b[B") {
        // Arrow Down
        term.current?.write("\r\n");
        term.current?.writeln("You pressed Arrow Down");
      } else {
        // Handle ENTER key
        if (code === 13) {
          const command = inputBuffer.current.trim();
          term.current?.write("\r\n"); // Move to new line
          handleCommand(command);
          inputBuffer.current = "";
          //  prompt();
          // Handle BACKSPACE
        } else if (code === 127) {
          if (inputBuffer.current.length > 0) {
            inputBuffer.current = inputBuffer.current.slice(0, -1);
            term.current?.write("\b \b"); // Remove character visually
          }
        } else {
          inputBuffer.current += data;
          term.current?.write(data);
        }
      }
    });

    const resizeObserver = new ResizeObserver(() => fitAddon.fit());
    resizeObserver.observe(terminalRef.current);

    prompt();

    return () => {
      term.current?.dispose();
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={terminalRef}
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000",
      }}
    />
  );
};

export default Xtrem;
