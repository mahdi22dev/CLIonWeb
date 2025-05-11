"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import dynamic from "next/dynamic";

const Xtrem = dynamic(() => import("@/components/xtrem"), { ssr: false });

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [clientID, setClientID] = useState<number>(345345234235425);
  const [initPty, setInitPty] = useState<initPtyProps | null>(null);

  useEffect(() => {
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

    socketInstance.emit(
      "createTerminal",
      { id: clientID },
      async (response: initPtyProps) => {
        console.log("Server acknowledged createTerminal:", response);
        await new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
        setInitPty(response);
        console.log("Initial pty response:", response.propmt);
      }
    );

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <main className="flex min-h-screen w-full bg-slate-900">
      {socket ? (
        <Xtrem socket={socket} clientID={clientID} PROMPT={initPty?.propmt} />
      ) : (
        <p className="text-white m-auto">Connecting to terminal...</p>
      )}
    </main>
  );
}
