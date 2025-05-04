import Terminal from "@/components/terminal";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full bg-slate-900">
      <Terminal
        prompt="guest@react-terminal:~$"
        welcomeMessage=""
        theme="dark"
        className="w-full h-screen rounded-none border-none"
      />
    </main>
  );
}
