"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, ArrowUp, ArrowDown } from "lucide-react";

interface TerminalProps {
  prompt?: string;
  welcomeMessage?: string;
  theme?: "dark" | "light" | "matrix" | "retro";
  className?: string;
}

interface CommandOutput {
  id: number;
  command: string;
  output: React.ReactNode;
}

export default function Terminal({
  prompt = ">",
  welcomeMessage = "Welcome to the terminal. Type 'help' for a list of commands.",
  theme = "dark",
  className,
}: TerminalProps) {
  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandOutputs, setCommandOutputs] = useState<CommandOutput[]>([]);
  const [isMaximized, setIsMaximized] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Theme styles
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

  // Available commands
  const commands = {
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
    echo: (args: string[]) => <p>{args.join(" ")}</p>,
    date: () => <p>{new Date().toString()}</p>,
    whoami: () => <p>guest</p>,
    ls: () => (
      <div>
        <p className="text-blue-400">documents</p>
        <p className="text-blue-400">downloads</p>
        <p className="text-green-400">example.txt</p>
        <p className="text-green-400">readme.md</p>
      </div>
    ),
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

  // Auto-scroll to bottom when new commands are added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commandOutputs]);

  // Focus input on mount and when clicking terminal
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle up arrow for history navigation
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    }
    // Handle down arrow for history navigation
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput("");
      }
    }
    // Handle Enter to execute command
    else if (e.key === "Enter") {
      executeCommand();
    }
    // Handle tab completion (simple version)
    else if (e.key === "Tab") {
      e.preventDefault();
      const availableCommands = Object.keys(commands);
      const matchingCommands = availableCommands.filter((cmd) =>
        cmd.startsWith(input)
      );

      if (matchingCommands.length === 1) {
        setInput(matchingCommands[0] + " ");
      }
    }
  };

  const executeCommand = () => {
    if (!input.trim()) return;

    // Add to history
    setCommandHistory((prev) => [...prev, input]);
    setHistoryIndex(-1);

    // Parse command and arguments
    const [cmd, ...args] = input.trim().split(" ");
    const commandFn = commands[cmd as keyof typeof commands];

    // Execute command and get output
    let output: React.ReactNode;
    if (commandFn) {
      output = commandFn(args);
    } else {
      output = <p className="text-red-500">Command not found: {cmd}</p>;
    }

    // Special case for clear command
    if (cmd === "clear") {
      setCommandOutputs([]);
    } else {
      // Add command and output to terminal
      setCommandOutputs((prev) => [
        ...prev,
        {
          id: Date.now(),
          command: input,
          output,
        },
      ]);
    }

    // Reset input
    setInput("");
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
            onClick={() => commands.clear()}
            aria-label="Clear terminal"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Terminal content */}
      <div
        ref={terminalRef}
        className={cn(
          "p-4 font-mono text-sm overflow-y-auto",
          currentTheme.bg,
          currentTheme.text
        )}
        style={{ height: "calc(100% - 40px)" }}
        onClick={handleTerminalClick}
        role="region"
        aria-label="Terminal output"
        tabIndex={0}
      >
        {/* Welcome message - only show if not empty */}
        {welcomeMessage && <p className="mb-2">{welcomeMessage}</p>}

        {/* Command outputs */}
        {commandOutputs.map(({ id, command, output }) => (
          <div key={id} className="mb-2">
            <div className="flex">
              <span className={cn("mr-2", currentTheme.prompt)}>{prompt}</span>
              <span>{command}</span>
            </div>
            <div className="mt-1">{output}</div>
          </div>
        ))}

        {/* Current input line */}
        <div className="flex items-center">
          <span className={cn("mr-2", currentTheme.prompt)}>{prompt}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
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
