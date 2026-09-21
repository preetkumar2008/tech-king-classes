import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QuizManager from "./quiz-manager";

export default async function AdminQuizzesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/student/dashboard");

  const [{ data: courses }, { data: modules }, { data: quizzes }, { data: questions }, { data: options }, { data: answerKeys }] = await Promise.all([
    supabase.from("courses").select("id, title").order("title"),
    supabase.from("modules").select("id, course_id, title").order("sort_order"),
    supabase.from("quizzes").select("id, course_id, module_id, title, description, quiz_type, passing_percentage, time_limit_minutes, randomize_questions, randomize_options, is_published").order("created_at", { ascending: false }),
    supabase.from("quiz_questions").select("id, quiz_id, question_text, explanation, sort_order").order("sort_order"),
    supabase.from("quiz_options").select("id, question_id, option_text, sort_order, is_correct").order("sort_order"),
    supabase.from("quiz_answer_keys").select("question_id, correct_option_id"),
  ]);

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="dashboard-label">ASSESSMENT MANAGEMENT</p>
          <h1>Quiz Management</h1>
          <p>Create module/final tests, questions, options and passing rules.</p>
        </div>
        <div className="admin-header-actions">
          <Link href="/admin" className="secondary-button">← Dashboard</Link>
          <Link href="/tests" className="primary-button">Student Tests</Link>
        </div>
      </header>
      <QuizManager
        courses={courses ?? []}
        modules={modules ?? []}
        initialQuizzes={quizzes ?? []}
        initialQuestions={questions ?? []}
        initialOptions={options ?? []}
        initialAnswerKeys={answerKeys ?? []}
      />
    </main>
  );
}
