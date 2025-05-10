"use client";
import Terminal from "@/components/terminal";
import { Socket } from "net";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import dynamic from "next/dynamic";

const Xtrem = dynamic(() => import("@/components/xtrem"), { ssr: false });

export default function Home() {
  const [socket, setSocket] = useState<Socket>();

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io("http://localhost:3001", {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
    });

    socketInstance.on("commandOutput", (data) => {
      console.log(data);
    });

    if (socketInstance) {
      // @ts-ignore
      setSocket(socketInstance);
    }

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <main className="flex min-h-screen w-full bg-slate-900">
      {/* <Terminal
        prompt="guest@react-terminal:~$"
        theme="dark"
        className="w-full h-screen rounded-none border-none"
        // @ts-ignore
        socket={socket || undefined}
      /> */}
      {/* @ts-ignore */}
      <Xtrem socket={socket || undefined} />
    </main>
  );
}
