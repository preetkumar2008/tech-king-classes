import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StudentManager from "./student-manager";

export default async function AdminStudentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/student/dashboard");

  const [profilesRes, progressRes, attemptsRes, completionsRes, certificatesRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, mobile, email, profile_photo_url, role, created_at").eq("role", "student").order("created_at", { ascending: false }),
    supabase.from("lesson_progress").select("user_id, lesson_id, completed, completed_at"),
    supabase.from("quiz_attempts").select("id, user_id, quiz_id, score, total_questions, correct_answers, percentage, passed, submitted_at, started_at"),
    supabase.from("course_completions").select("id, user_id, course_id, completed_at"),
    supabase.from("certificates").select("id, user_id, certificate_id, course_id, course_name, issued_at"),
  ]);

  const lessonIds = [...new Set((progressRes.data ?? []).map((p) => p.lesson_id))];
  const quizIds = [...new Set((attemptsRes.data ?? []).map((a) => a.quiz_id))];
  const courseIds = [...new Set([
    ...(completionsRes.data ?? []).map((c) => c.course_id),
    ...(certificatesRes.data ?? []).map((c) => c.course_id),
  ])];

  const [{ data: lessons }, { data: quizzes }, { data: courses }] = await Promise.all([
    lessonIds.length ? supabase.from("lessons").select("id, title, module_id").in("id", lessonIds) : Promise.resolve({ data: [] as { id: string; title: string; module_id: string }[] }),
    quizIds.length ? supabase.from("quizzes").select("id, title, course_id").in("id", quizIds) : Promise.resolve({ data: [] as { id: string; title: string; course_id: string }[] }),
    courseIds.length ? supabase.from("courses").select("id, title").in("id", courseIds) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const studentRows = (profilesRes.data ?? []).map((student) => ({
    ...student,
    progressCount: (progressRes.data ?? []).filter((p) => p.user_id === student.id && p.completed).length,
    quizAttempts: (attemptsRes.data ?? []).filter((a) => a.user_id === student.id).length,
    passedQuizzes: (attemptsRes.data ?? []).filter((a) => a.user_id === student.id && a.passed).length,
    completions: (completionsRes.data ?? []).filter((c) => c.user_id === student.id).length,
    certificates: (certificatesRes.data ?? []).filter((c) => c.user_id === student.id).length,
  }));

  const details = {
    progress: progressRes.data ?? [],
    attempts: attemptsRes.data ?? [],
    completions: completionsRes.data ?? [],
    certificates: certificatesRes.data ?? [],
    lessons: lessons ?? [],
    quizzes: quizzes ?? [],
    courses: courses ?? [],
  };

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="dashboard-label">STUDENT MANAGEMENT</p>
          <h1>Students</h1>
          <p>View student profiles, learning activity, quiz results and certificates.</p>
        </div>
        <div className="admin-header-actions">
          <Link href="/admin" className="secondary-button">← Dashboard</Link>
          <Link href="/courses" className="primary-button">View Website</Link>
        </div>
      </header>
      <StudentManager students={studentRows} details={details} />
    </main>
  );
}
