"use client";
import React, { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { FitAddon } from "@xterm/addon-fit";
import { Socket } from "socket.io-client";
import { initPtyProps } from "@/lib/types";

interface TerminalProps {
  PROMPT?: string;
  socket: Socket | undefined;
  clientID: number;
  setInitPty: React.Dispatch<React.SetStateAction<initPtyProps | null>>;
  initPty: initPtyProps | null;
}

interface DataPayload {
  id: number;
  data: string;
}

const Xtrem = ({
  PROMPT,
  socket,
  clientID,
  setInitPty,
  initPty,
}: TerminalProps) => {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const term = useRef<Terminal | null>(null);
  const inputBuffer = useRef<string>("");
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentCommand, setCurrentCommand] = useState<DataPayload>();
  const commandHistory = useRef<string[]>([]);
  const prompt = () => {
    term.current?.write("\r\n");
    term.current?.write(`${PROMPT}`);
  };

  useEffect(() => {
    if (!socket) return;
    if (!term.current) return;

    socket?.on("commandOutput", (data: DataPayload) => {
      term.current?.write("\r\n");
      if (data.data) {
        term.current?.write(data.data.toString());
      }
    });

    return () => {
      socket.off("commandOutput", () => {});
      socket.off("terminalPID", () => {});
    };
  }, [socket]);

  const handleCommand = (command: string) => {
    if (!term.current) return;

    commandHistory.current = [...commandHistory.current, command];
    switch (command) {
      case "help":
        term.current.writeln("Available commands: help, clear, echo [text]");
        break;
      case "clear":
        term.current.clear();
        socket?.emit(
          "createTerminal",
          { id: clientID },
          async (response: initPtyProps) => {
            setInitPty(response);
            initPty && prompt();
          }
        );
        break;
      default:
        if (command.length > 0) {
          const cmd = { id: clientID, data: command };
          setCurrentCommand(cmd);
          socket?.emit("executeCommand", { clientID, command });
        }
    }
  };

  useEffect(() => {
    console.log(historyIndex);
    console.log(commandHistory.current.length);
    if (historyIndex < commandHistory.current.length) {
      console.log("command we set:", commandHistory.current[historyIndex - 1]);
    }
  }, [commandHistory.current, historyIndex]);

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

    prompt();
    term.current?.onData((data) => {
      const code = data.charCodeAt(0);
      // Handle Arrow Keys
      if (data === "\u001b[A") {
        const lastCommand = commandHistory.current.length - 1;
        console.log("last commnad", lastCommand);
        term.current?.writeln(`${commandHistory.current[lastCommand]}`);
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

    return () => {
      term.current?.dispose();
      resizeObserver.disconnect();
      socket.off("createTerminal", () => {});
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
