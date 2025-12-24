import { MarsMap } from "@/components/MarsMap";

export default function Home() {
  return (
    <main className="h-screen w-full bg-black selection:bg-orange-500 selection:text-white overflow-hidden">
      <MarsMap />
    </main>
  );
}
