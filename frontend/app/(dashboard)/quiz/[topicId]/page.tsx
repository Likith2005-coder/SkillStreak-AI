"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
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
      <main className="container px-4 py-10">
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
        <Button variant="ghost" size="sm" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </main>
    );
  }

  if (!topic) {
    return (
      <main className="container flex items-center justify-center px-4 py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </main>
    );
  }

  return (
    <main className="container max-w-3xl px-4 py-10">
      <Link
        href={`/topic/${topic.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to topic
      </Link>

      <div className="mt-6">
        <QuizPlayer topicId={topic.id} topicTitle={topic.title} />
      </div>
    </main>
  );
}
