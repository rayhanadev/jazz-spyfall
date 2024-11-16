"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-80 h-full gap-4 mx-auto">
      <h1 className="text-4xl font-bold">Home</h1>
      <p className="mb-8">
        This is a recreation of Spyfall! Built using Jazz 🎶 with 💛 by Purdue
        Hackers.
      </p>
      <Button
        type="button"
        onClick={() => router.push("/create")}
        className="h-24 w-64 text-2xl"
      >
        Create Room
      </Button>
    </div>
  );
}
