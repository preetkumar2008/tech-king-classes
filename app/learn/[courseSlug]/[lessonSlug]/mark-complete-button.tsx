"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  lessonId: string;
  courseId: string;
  completed: boolean;
};

export default function MarkCompleteButton({
  lessonId,
  courseId,
  completed,
}: Props) {
  const supabase = createClient();

  const [isCompleted, setIsCompleted] =
    useState(completed);

  const [loading, setLoading] = useState(false);
  const [certificateId, setCertificateId] = useState<string | null>(null);

  async function handleComplete() {
    if (isCompleted || loading) {
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("lesson_progress")
      .upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,lesson_id",
        }
      );

    if (error) {
      setLoading(false);
      return;
    }

    const { data: completionRows, error: completionError } = await supabase.rpc(
      "complete_course_if_eligible",
      { p_course_id: courseId }
    );

    setLoading(false);
    setIsCompleted(true);

    if (!completionError && completionRows?.[0]?.completed) {
      setCertificateId(completionRows[0].certificate_id);
    }
  }

  return (
    <>
    <button
      onClick={handleComplete}
      disabled={isCompleted || loading}
      className={
        isCompleted
          ? "complete-button completed"
          : "complete-button"
      }
    >
      {loading
        ? "Saving..."
        : isCompleted
          ? "✓ Lesson Completed"
          : "Mark as Complete"}
    </button>

    {certificateId && (
      <a
        href={`/certificates/verify/${certificateId}`}
        className="certificate-generated-link"
      >
        🎓 Certificate Generated →
      </a>
    )}
    </>
  );
}