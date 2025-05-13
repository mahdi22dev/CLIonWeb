"use client";

import { useState } from "react";
import Terminal from "./terminal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function TerminalDemo() {
  const [theme, setTheme] = useState<"dark" | "light" | "matrix" | "retro">(
    "dark"
  );
  const [prompt, setPrompt] = useState("guest@react-terminal:~$");
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Welcome to React Terminal! Type 'help' to see available commands."
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="theme-select"
            className="block text-sm font-medium text-gray-200 mb-1"
          >
            Theme
          </label>
          <Select
            value={theme}
            onValueChange={(value: any) => setTheme(value as any)}
          >
            <SelectTrigger id="theme-select">
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="matrix">Matrix</SelectItem>
              <SelectItem value="retro">Retro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label
            htmlFor="prompt-input"
            className="block text-sm font-medium text-gray-200 mb-1"
          >
            Prompt
          </label>
          <Input
            id="prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <label
            htmlFor="welcome-input"
            className="block text-sm font-medium text-gray-200 mb-1"
          >
            Welcome Message
          </label>
          <Input
            id="welcome-input"
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <Terminal prompt={prompt} welcomeMessage={welcomeMessage} theme={theme} />

      <div className="bg-gray-800 rounded-lg p-4 text-gray-200">
        <h3 className="text-lg font-medium mb-2">Usage Instructions</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Type <code className="bg-gray-700 px-1 rounded">help</code> to see
            available commands
          </li>
          <li>Use up/down arrows to navigate command history</li>
          <li>Press Tab for command auto-completion</li>
          <li>
            Try commands like{" "}
            <code className="bg-gray-700 px-1 rounded">echo Hello World</code>,{" "}
            <code className="bg-gray-700 px-1 rounded">date</code>, or{" "}
            <code className="bg-gray-700 px-1 rounded">ls</code>
          </li>
          <li>
            Change the theme with{" "}
            <code className="bg-gray-700 px-1 rounded">theme matrix</code>
          </li>
        </ul>
      </div>
    </div>
  );
}
