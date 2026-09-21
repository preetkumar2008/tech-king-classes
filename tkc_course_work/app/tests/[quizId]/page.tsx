import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QuizForm from "./quiz-form";

type Props = {
  params: Promise<{ quizId: string }>;
};

export default async function QuizPage({ params }: Props) {
  const { quizId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/tests/${quizId}`);
  }

  const { data: quiz } = await supabase
    .from("quizzes")
    .select(`
      id,
      title,
      description,
      passing_percentage,
      time_limit_minutes,
      quiz_type,
      courses (
        title,
        slug
      )
    `)
    .eq("id", quizId)
    .eq("is_published", true)
    .single();

  if (!quiz) {
    notFound();
  }

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select(`
      id,
      question_text,
      sort_order,
      quiz_options (
        id,
        option_text,
        sort_order
      )
    `)
    .eq("quiz_id", quizId)
    .order("sort_order", { ascending: true });

  if (!questions?.length) {
    return (
      <main className="page-container">
        <div className="empty-state">
          <h1>Test is not ready</h1>
          <p>No questions have been added yet.</p>
        </div>
      </main>
    );
  }

  const formattedQuestions = questions.map((question) => ({
    id: question.id,
    question_text: question.question_text,
    options: [...(question.quiz_options ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    ),
  }));

  return (
    <main className="page-container quiz-page">
      <section className="quiz-header">
        <span className="eyebrow">
          {quiz.quiz_type === "final" ? "Final Test" : "Module Quiz"}
        </span>

        <h1>{quiz.title}</h1>

        <p>
          {quiz.description ||
            "Answer all questions and submit your test."}
        </p>

        <div className="quiz-info">
          <span>
            🎯 Passing: <strong>{quiz.passing_percentage}%</strong>
          </span>

          <span>
            📝 Questions: <strong>{formattedQuestions.length}</strong>
          </span>

          {quiz.time_limit_minutes && (
            <span>
              ⏱ Time: <strong>{quiz.time_limit_minutes} min</strong>
            </span>
          )}
        </div>
      </section>

      <QuizForm
        quizId={quiz.id}
        questions={formattedQuestions}
        passingPercentage={quiz.passing_percentage}
      />
    </main>
  );
}