import { Mascot } from "@/components/playground/Mascot";

export default function Loading() {
  return (
    <main className="container flex min-h-[60vh] items-center justify-center px-4 py-16" role="status">
      <Mascot message="Cooking up 5 fresh questions…" size={104} />
    </main>
  );
}
