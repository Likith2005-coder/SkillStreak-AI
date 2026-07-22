"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { apiErrorMessage, fetchMe, updateProfile } from "@/lib/api";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/lib/utils";

const onboardingSchema = z.object({
  priorLevel: z.enum(["none", "some", "experienced"], {
    message: "Pick the option that fits you best",
  }),
  goal: z.enum(["interview", "awareness", "curiosity"], {
    message: "Choose your main goal",
  }),
  pace: z.enum(["relaxed", "standard", "intense"], {
    message: "Choose a pace you can stick to",
  }),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

const PRIOR_LEVEL_OPTIONS: Array<{
  value: OnboardingValues["priorLevel"];
  title: string;
  description: string;
}> = [
  { value: "none", title: "Brand new", description: "I'm starting from scratch." },
  { value: "some", title: "Some experience", description: "I know a few things; want structure." },
  { value: "experienced", title: "Experienced", description: "I want to sharpen and fill gaps." },
];

const GOAL_OPTIONS: Array<{
  value: OnboardingValues["goal"];
  title: string;
  description: string;
}> = [
  { value: "interview", title: "Crack interviews", description: "Prep for placements or job hunts." },
  { value: "awareness", title: "Build awareness", description: "Stay current with where tech is going." },
  { value: "curiosity", title: "Pure curiosity", description: "I just love learning new things." },
];

const PACE_OPTIONS: Array<{
  value: OnboardingValues["pace"];
  title: string;
  description: string;
}> = [
  { value: "relaxed", title: "Relaxed", description: "A few topics a week is plenty." },
  { value: "standard", title: "Standard", description: "Daily streak, steady progress." },
  { value: "intense", title: "Intense", description: "Multiple topics a day. Let's go." },
];

export default function OnboardingPage() {
  const router = useRouter();
  const setMe = useUserStore((s) => s.setMe);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
  });

  const onSubmit = async (values: OnboardingValues) => {
    setFormError(null);
    try {
      await updateProfile(values);
      const me = await fetchMe();
      setMe(me);
      router.replace("/dashboard");
    } catch (err) {
      setFormError(apiErrorMessage(err, "Could not save your profile"));
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Let&apos;s tune SkillStreak to you
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Three quick questions. We use this to set your starting level and pace
        — and to personalize the career map you unlock by finishing a roadmap.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-8" noValidate>
        <Controller
          name="priorLevel"
          control={control}
          render={({ field }) => (
            <ChoiceGroup
              legend="What's your prior experience with tech?"
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              options={PRIOR_LEVEL_OPTIONS}
            />
          )}
        />
        <FieldError message={errors.priorLevel?.message} />

        <Controller
          name="goal"
          control={control}
          render={({ field }) => (
            <ChoiceGroup
              legend="What's your main goal?"
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              options={GOAL_OPTIONS}
            />
          )}
        />
        <FieldError message={errors.goal?.message} />

        <Controller
          name="pace"
          control={control}
          render={({ field }) => (
            <ChoiceGroup
              legend="What pace works for you?"
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              options={PACE_OPTIONS}
            />
          )}
        />
        <FieldError message={errors.pace?.message} />

        {formError && (
          <div
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {formError}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Saving…" : "Finish setup"}
        </Button>
      </form>
    </div>
  );
}

type ChoiceOption<T extends string> = {
  value: T;
  title: string;
  description: string;
};

function ChoiceGroup<T extends string>({
  legend,
  hint,
  name,
  value,
  onChange,
  options,
}: {
  legend: string;
  hint?: string;
  name: string;
  value: T | undefined;
  onChange: (val: T) => void;
  options: ChoiceOption<T>[];
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-foreground">{legend}</legend>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <label
              key={opt.value}
              className={cn(
                "group relative flex cursor-pointer flex-col rounded-xl border p-4 text-left transition-all",
                selected
                  ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                  : "border-border bg-card/40 hover:border-primary/40 hover:bg-card/70"
              )}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={selected}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              <span className="text-sm font-medium text-foreground">{opt.title}</span>
              <span className="mt-1 text-xs text-muted-foreground">
                {opt.description}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
