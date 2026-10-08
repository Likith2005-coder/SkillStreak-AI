"use client";

import { useEffect, useState } from "react";
import { Link } from "next-view-transitions";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Mascot } from "@/components/playground/Mascot";
import { Button } from "@/components/ui/button";
import { apiErrorMessage, fetchTopic, type TopicView } from "@/lib/api";
import { QuizPlayer } from "@/components/quiz/QuizPlayer";

export default function QuizPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const router = useRouter();
  const [topic, setTopic] = useState<TopicView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!topicId) return;
    let cancelled = false;
    fetchTopic(topicId)
      .then((t) => {
        if (!cancelled) setTopic(t);
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, "Could not load topic"));
      });
    return () => {
      cancelled = true;
    };
  }, [topicId]);

  if (error) {
    return (
      <main className="container max-w-3xl px-4 py-8">
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive-text">
          {error}
        </div>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" strokeWidth={2.2} /> Back
        </Button>
      </main>
    );
  }

  if (!topic) {
    return (
      <main className="container flex min-h-[60vh] items-center justify-center px-4 py-16" role="status">
        <Mascot message="Cooking up 5 fresh questions…" size={104} />
      </main>
    );
  }

  return (
    <main className="container relative max-w-3xl px-4 py-8">
      {/* A faint pool of light above the question */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-10 -z-10 h-[320px] overflow-hidden">
        <div className="absolute left-1/2 top-[-40%] h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-aurora-2/10 blur-[90px]" />
      </div>
      <Link
        href={`/topic/${topic.id}`}
        className="focus-ring group -ml-2 inline-flex h-11 max-w-full items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none" strokeWidth={2.2} />
        <span className="truncate">Back to {topic.title}</span>
      </Link>

      <div className="mt-4">
        <QuizPlayer topicId={topic.id} topicTitle={topic.title} />
      </div>
    </main>
  );
}
