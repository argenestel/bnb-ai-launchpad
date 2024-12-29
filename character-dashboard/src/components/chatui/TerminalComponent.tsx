import React, { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Terminal, Circle } from "lucide-react";

const TerminalComponent = ({ messages, character }) => {
  const [terminalHistory, setTerminalHistory] = React.useState([
    { type: "system", content: "> SYSTEM INITIALIZED" },
    { type: "system", content: "> NEURAL NETWORK ONLINE" },
    {
      type: "system",
      content: `> LOADING CHARACTER: ${character?.name || "UNKNOWN"}`,
    },
  ]);
  const [input, setInput] = React.useState("");
  const terminalEndRef = useRef(null);

  useEffect(() => {
    // Add message history to terminal
    const terminalMessages = messages.map((msg) => ({
      type: msg.role === "user" ? "input" : "output",
      content: msg.role === "user" ? `> ${msg.content}` : msg.content,
    }));
    setTerminalHistory((prev) => [...prev, ...terminalMessages]);
  }, [messages]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalHistory]);

  const handleCommand = (e) => {
    if (e.key === "Enter") {
      const command = input.trim();
      if (!command) return;

      setTerminalHistory((prev) => [
        ...prev,
        { type: "input", content: `> ${command}` },
      ]);

      // Process commands
      if (command.toLowerCase() === "help") {
        setTerminalHistory((prev) => [
          ...prev,
          {
            type: "system",
            content: `
Available commands:
- status     : Show system status
- clear      : Clear terminal
- info       : Show character info
- help       : Show this help message`,
          },
        ]);
      } else if (command.toLowerCase() === "status") {
        setTerminalHistory((prev) => [
          ...prev,
          {
            type: "system",
            content: `
SYSTEM STATUS:
- Neural Network: ACTIVE
- Voice Synthesis: ${character?.voice?.model || "STANDBY"}
- Memory Banks: ONLINE
- Response Engine: READY`,
          },
        ]);
      } else if (command.toLowerCase() === "clear") {
        setTerminalHistory([
          { type: "system", content: "> TERMINAL CLEARED" },
          { type: "system", content: "> SYSTEM READY" },
        ]);
      } else if (command.toLowerCase() === "info") {
        setTerminalHistory((prev) => [
          ...prev,
          {
            type: "system",
            content: `
CHARACTER INFO:
Name: ${character?.name || "UNKNOWN"}
Model: ${character?.modelProvider || "UNDEFINED"}
Traits: ${character?.traits?.join(", ") || "NONE"}
Voice: ${character?.voice?.model || "DEFAULT"}`,
          },
        ]);
      } else {
        setTerminalHistory((prev) => [
          ...prev,
          {
            type: "error",
            content: `Command not recognized: ${command}. Type 'help' for available commands.`,
          },
        ]);
      }

      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/90 text-green-500 font-mono rounded-md">
      <div className="flex items-center gap-2 p-2 border-b border-green-500/20">
        <Circle className="w-3 h-3 fill-green-500 animate-pulse" />
        <span className="text-xs">TERMINAL_CONNECTION_ESTABLISHED</span>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {terminalHistory.map((entry, idx) => (
            <div
              key={idx}
              className={`font-mono text-sm ${
                entry.type === "error"
                  ? "text-red-500"
                  : entry.type === "input"
                    ? "text-blue-500"
                    : entry.type === "output"
                      ? "text-yellow-500"
                      : "text-green-500"
              }`}
            >
              {entry.content}
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-green-500/20">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleCommand}
            placeholder="Enter command..."
            className="border-0 bg-transparent text-green-500 placeholder:text-green-500/50 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </div>
    </div>
  );
};

export default TerminalComponent;
