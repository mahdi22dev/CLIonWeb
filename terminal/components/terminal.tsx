"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, ArrowUp, ArrowDown } from "lucide-react";
import { Socket } from "socket.io-client";

interface TerminalProps {
  prompt?: string;
  welcomeMessage?: string;
  theme?: "dark" | "light" | "matrix" | "retro";
  className?: string;
  socket: Socket;
}

interface CommandOutput {
  id: number;
  command: string;
  output: React.ReactNode;
  isPending?: boolean;
}

export default function Terminal({
  prompt = ">",
  welcomeMessage = "Welcome to the terminal. Type 'help' for a list of commands.",
  theme = "dark",
  className,
  socket,
}: TerminalProps) {
  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandOutputs, setCommandOutputs] = useState<CommandOutput[]>([]);
  const [isMaximized, setIsMaximized] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const themeStyles = {
    dark: {
      bg: "bg-gray-900",
      text: "text-gray-100",
      prompt: "text-green-400",
      input: "text-gray-100",
      border: "border-gray-700",
      header: "bg-gray-800",
      headerText: "text-gray-300",
    },
    light: {
      bg: "bg-gray-100",
      text: "text-gray-800",
      prompt: "text-blue-600",
      input: "text-gray-800",
      border: "border-gray-300",
      header: "bg-gray-200",
      headerText: "text-gray-700",
    },
    matrix: {
      bg: "bg-black",
      text: "text-green-500",
      prompt: "text-green-400",
      input: "text-green-300",
      border: "border-green-900",
      header: "bg-green-900",
      headerText: "text-green-100",
    },
    retro: {
      bg: "bg-amber-950",
      text: "text-amber-200",
      prompt: "text-amber-400",
      input: "text-amber-100",
      border: "border-amber-800",
      header: "bg-amber-900",
      headerText: "text-amber-100",
    },
  };

  const currentTheme = themeStyles[theme];

  // Available local commands
  const localCommands = {
    help: () => (
      <div className="pl-4">
        <p>Available commands:</p>
        <ul className="list-disc pl-8">
          <li>help - Show this help message</li>
          <li>clear - Clear the terminal</li>
          <li>echo [text] - Display the text</li>
          <li>date - Show current date and time</li>
          <li>whoami - Display current user</li>
          <li>ls - List directory contents</li>
          <li>theme [dark|light|matrix|retro] - Change terminal theme</li>
          <li>history - Show command history</li>
        </ul>
      </div>
    ),
    clear: () => {
      setCommandOutputs([]);
      return null;
    },
    theme: (args: string[]) => {
      const newTheme = args[0] as "dark" | "light" | "matrix" | "retro";
      if (["dark", "light", "matrix", "retro"].includes(newTheme)) {
        return <p>Theme changed to {newTheme}</p>;
      } else {
        return (
          <p className="text-red-500">
            Invalid theme. Available themes: dark, light, matrix, retro
          </p>
        );
      }
    },
    history: () => (
      <div>
        {commandHistory.map((cmd, index) => (
          <p key={index}>
            {index + 1}: {cmd}
          </p>
        ))}
      </div>
    ),
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commandOutputs]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleCommandOutput = ({
      id,
      data,
    }: {
      id: number;
      data: string;
    }) => {
      setCommandOutputs((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                output: (
                  <>
                    {item.output}
                    <pre>{data}</pre>
                  </>
                ),
                isPending: false,
              }
            : item
        )
      );
    };

    socket.on("commandOutput", handleCommandOutput);

    return () => {
      socket.off("commandOutput", handleCommandOutput);
    };
  }, [socket]);

  const executeCommand = () => {
    if (!input.trim()) return;

    // Add to history
    setCommandHistory((prev) => [...prev, input]);
    setHistoryIndex(-1);

    // Parse command and arguments
    const [cmd, ...args] = input.trim().split(" ");

    // Check if it's a local command
    if (cmd in localCommands) {
      const commandFn = localCommands[cmd as keyof typeof localCommands];
      const output = commandFn(args);

      setCommandOutputs((prev) => [
        ...prev,
        {
          id: Date.now(),
          command: input,
          output,
        },
      ]);
    } else {
      const id = Date.now();

      setCommandOutputs((prev) => [
        ...prev,
        {
          id,
          command: input,
          output: "",
          isPending: true,
        },
      ]);

      socket.emit("executeCommand", { id, command: input });
    }

    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput("");
      }
    } else if (e.key === "Enter") {
      executeCommand();
    } else if (e.key === "Tab") {
      e.preventDefault();
      const availableCommands = Object.keys(localCommands);
      const matchingCommands = availableCommands.filter((cmd) =>
        cmd.startsWith(input)
      );

      if (matchingCommands.length === 1) {
        setInput(matchingCommands[0] + " ");
      }
    }
  };

  return (
    <div
      className={cn(
        "overflow-hidden border shadow-lg transition-all duration-200",
        currentTheme.border,
        isMaximized ? "h-full" : "h-64",
        className
      )}
    >
      {/* Terminal header */}
      <div
        className={cn(
          "px-4 py-2 flex items-center justify-between",
          currentTheme.header
        )}
      >
        <div className="flex space-x-2">
          <div
            className="w-3 h-3 rounded-full bg-red-500"
            onClick={() => setIsMaximized(false)}
          />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div
            className="w-3 h-3 rounded-full bg-green-500"
            onClick={() => setIsMaximized(true)}
          />
        </div>
        <div className={cn("text-sm font-medium", currentTheme.headerText)}>
          Terminal
        </div>
        <div className="flex space-x-2">
          <button
            className="focus:outline-none"
            onClick={() => setIsMaximized(!isMaximized)}
            aria-label={isMaximized ? "Minimize terminal" : "Maximize terminal"}
          >
            {isMaximized ? (
              <ArrowDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ArrowUp className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button
            className="focus:outline-none"
            onClick={() => localCommands.clear()}
            aria-label="Clear terminal"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div
        ref={terminalRef}
        className={cn(
          "p-4 font-mono text-sm overflow-y-auto",
          currentTheme.bg,
          currentTheme.text
        )}
        style={{ height: "calc(100% - 40px)" }}
        tabIndex={0}
      >
        {welcomeMessage && <p className="mb-2">{welcomeMessage}</p>}

        {commandOutputs.map(({ id, command, output }) => (
          <div key={id} className="mb-2">
            <div className="flex">
              <span className={cn("mr-2", currentTheme.prompt)}>{prompt}</span>
              <span>{command}</span>
            </div>
            <div className="mt-1">{output}</div>
          </div>
        ))}

        <div className="flex items-center">
          <span className={cn("mr-2", currentTheme.prompt)}>{prompt}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              "flex-1 bg-transparent border-none outline-none",
              currentTheme.input
            )}
            aria-label="Terminal input"
            autoComplete="off"
            spellCheck="false"
          />
        </div>
      </div>
    </div>
  );
}
