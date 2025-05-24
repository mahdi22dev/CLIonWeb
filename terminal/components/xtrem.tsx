"use client";
import React, { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { FitAddon } from "@xterm/addon-fit";
import { Socket } from "socket.io-client";
import { initPtyProps } from "@/lib/types";
import { stripAnsi } from "@/lib/utils";

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
  const commandHistory = useRef<string[]>(["pnpm root", "ls", "ipconfig"]);
  const historyIndex = useRef<number>(-1);
  const lastcommand = useRef<number>(0);

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
    console.log(commandHistory.current);

    if (command.length > 0) {
      const cmd = { clientID, command };
      socket?.emit("executeCommand", cmd);
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

    prompt();
    term.current?.onData((data) => {
      const code = data.charCodeAt(0);
      // Handle Arrow Keys
      if (data === "\u001b[A") {
        console.log("command history", commandHistory.current);
        if (historyIndex.current < commandHistory.current.length - 1) {
          historyIndex.current++;
          const historyCmd =
            commandHistory.current[
              commandHistory.current.length - 1 - historyIndex.current
            ];

          const stripedPrompt = stripAnsi(PROMPT || "");
          term.current?.write(`\x1b[${stripedPrompt.length + 1}G`); // Go to column 2 (after prompt)
          term.current?.write("\x1b[K");

          inputBuffer.current = historyCmd;
          console.log(
            "previous command ",
            commandHistory.current[
              commandHistory.current.length - 1 - historyIndex.current - 1
            ]
          );

          term.current?.write(historyCmd);
        }
      } else if (data === "\u001b[B") {
        // Arrow Down
        term.current?.write("\r\n");
        term.current?.writeln("You pressed Arrow Down");
      } else {
        // Handle ENTER key
        if (code === 13) {
          handleCommand(inputBuffer.current);
          inputBuffer.current = "";
          // Handle BACKSPACE
        } else if (code === 127) {
          if (inputBuffer.current.length > 0) {
            inputBuffer.current = inputBuffer.current.slice(0, -1);
            term.current?.write("\b \b");
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
