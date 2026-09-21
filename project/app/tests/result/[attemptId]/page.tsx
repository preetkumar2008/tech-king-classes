import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ attemptId: string }>;
};

export default async function TestResultPage({ params }: Props) {
  const { attemptId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select(`
      id,
      score,
      total_questions,
      correct_answers,
      percentage,
      passed,
      submitted_at,
      quizzes (
        title,
        passing_percentage,
        courses (
          title,
          slug
        )
      )
    `)
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .single();

  if (!attempt) {
    notFound();
  }

  const quiz = Array.isArray(attempt.quizzes)
    ? attempt.quizzes[0]
    : attempt.quizzes;

  const course = quiz
    ? Array.isArray(quiz.courses)
      ? quiz.courses[0]
      : quiz.courses
    : null;

  return (
    <main className="page-container result-page">
      <section className={`result-card ${attempt.passed ? "passed" : "failed"}`}>
        <div className="result-icon">
          {attempt.passed ? "🎉" : "📚"}
        </div>

        <span className="eyebrow">
          {attempt.passed ? "Test Passed" : "Keep Learning"}
        </span>

        <h1>{quiz?.title || "Test Result"}</h1>

        <div className="result-score">
          {Number(attempt.percentage).toFixed(0)}%
        </div>

        <p className="result-message">
          {attempt.passed
            ? "Congratulations! You have successfully passed this test."
            : `You need ${quiz?.passing_percentage ?? 60}% to pass. Keep practicing and try again.`}
        </p>

        <div className="result-stats">
          <div>
            <strong>{attempt.correct_answers}</strong>
            <span>Correct</span>
          </div>

          <div>
            <strong>{attempt.total_questions}</strong>
            <span>Total</span>
          </div>

          <div>
            <strong>{quiz?.passing_percentage ?? 60}%</strong>
            <span>Passing</span>
          </div>
        </div>

        <div className="result-actions">
          <Link href="/tests" className="secondary-button">
            All Tests
          </Link>

          {course?.slug && (
            <Link
              href={`/courses/${course.slug}`}
              className="primary-button"
            >
              Back to Course →
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}