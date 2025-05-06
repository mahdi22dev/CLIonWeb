import React, { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

const Xtrem: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const term = useRef<Terminal | null>(null);
  const inputBuffer = useRef<string>("");

  const PROMPT = "$mahdi@xtrem:~$ ";

  useEffect(() => {
    if (!terminalRef.current) return;
    const rowHeight = 1;
    const rows = Math.floor(window.innerHeight / rowHeight);
    term.current = new Terminal({
      cursorBlink: true,
      rows: 60,
      fontSize: 16,
      theme: {
        background: "#000000",
        foreground: "#00ff00",
      },
    });

    term.current.open(terminalRef.current);
    prompt();

    term.current.onData((data) => {
      const code = data.charCodeAt(0);

      // Handle ENTER key
      if (code === 13) {
        const command = inputBuffer.current.trim();
        term.current?.write("\r\n"); // Move to new line
        handleCommand(command);
        inputBuffer.current = "";
        prompt();

        // Handle BACKSPACE
      } else if (code === 127) {
        if (inputBuffer.current.length > 0) {
          inputBuffer.current = inputBuffer.current.slice(0, -1);
          term.current?.write("\b \b"); // Remove character visually
        }

        // Handle printable characters
      } else {
        inputBuffer.current += data;
        term.current?.write(data); // Echo typed character
      }
    });

    return () => {
      term.current?.dispose();
    };
  }, []);

  const prompt = () => {
    term.current?.write(PROMPT);
  };

  const handleCommand = (command: string) => {
    if (!term.current) return;

    switch (command) {
      case "help":
        term.current.writeln("Available commands: help, clear, echo [text]");
        break;
      case "clear":
        term.current.clear();
        break;
      default:
        if (command.startsWith("echo ")) {
          term.current.writeln(command.slice(5));
        } else if (command.length > 0) {
          term.current.writeln(`Command not found: ${command}`);
        }
    }
  };

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
