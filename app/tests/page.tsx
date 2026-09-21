import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function TestsPage() {
  const supabase = await createClient();

  const { data: quizzes, error } = await supabase
    .from("quizzes")
    .select(`
      id,
      title,
      description,
      quiz_type,
      passing_percentage,
      time_limit_minutes,
      courses (
        title,
        slug
      )
    `)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    return <main className="page-container"><p>Unable to load tests.</p></main>;
  }

  return (
    <main className="page-container">
      <section className="page-header">
        <span className="eyebrow">Tech King Classes</span>
        <h1>Tests & Quizzes</h1>
        <p>Test your knowledge and track your learning progress.</p>
      </section>

      <section className="test-grid">
        {quizzes?.map((quiz) => {
          const course = Array.isArray(quiz.courses)
            ? quiz.courses[0]
            : quiz.courses;

          return (
            <article className="test-card" key={quiz.id}>
              <div className="test-icon">📝</div>

              <span className="test-type">
                {quiz.quiz_type === "final" ? "Final Test" : "Module Quiz"}
              </span>

              <h2>{quiz.title}</h2>

              <p>
                {quiz.description ||
                  "Complete this test and check your knowledge."}
              </p>

              <div className="test-meta">
                <span>🎯 Pass: {quiz.passing_percentage}%</span>

                {quiz.time_limit_minutes && (
                  <span>⏱ {quiz.time_limit_minutes} min</span>
                )}
              </div>

              {course && (
                <small className="test-course">
                  Course: {course.title}
                </small>
              )}

              <Link
                href={`/tests/${quiz.id}`}
                className="primary-button"
              >
                Start Test →
              </Link>
            </article>
          );
        })}
      </section>

      {(!quizzes || quizzes.length === 0) && (
        <div className="empty-state">
          <h2>No tests available</h2>
          <p>New tests will appear here soon.</p>
        </div>
      )}
    </main>
  );
}