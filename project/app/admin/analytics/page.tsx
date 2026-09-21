import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type CourseRow = {
  id: string;
  title: string;
  is_published: boolean;
};

type EnrollmentRow = { course_id: string; status: string };
type ProgressRow = { user_id: string; lesson_id: string; completed: boolean };
type AttemptRow = { user_id: string; quiz_id: string; percentage: number; passed: boolean };
type CompletionRow = { user_id: string; course_id: string };
type CertificateRow = { course_id: string; user_id: string };
type LessonRow = { id: string; module_id: string };
type ModuleRow = { id: string; course_id: string };
type QuizRow = { id: string; course_id: string };

function percent(value: number) {
  return `${Math.round(Math.max(0, Math.min(100, value)))}%`;
}

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/student/dashboard");

  const [
    { count: studentCount },
    { data: courses },
    { data: enrollments },
    { data: progress },
    { data: attempts },
    { data: completions },
    { data: certificates },
    { data: lessons },
    { data: modules },
    { data: quizzes },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("courses").select("id, title, is_published").order("created_at", { ascending: false }),
    supabase.from("enrollments").select("course_id, status"),
    supabase.from("lesson_progress").select("user_id, lesson_id, completed").eq("completed", true),
    supabase.from("quiz_attempts").select("user_id, quiz_id, percentage, passed"),
    supabase.from("course_completions").select("user_id, course_id"),
    supabase.from("certificates").select("course_id, user_id"),
    supabase.from("lessons").select("id, module_id"),
    supabase.from("modules").select("id, course_id"),
    supabase.from("quizzes").select("id, course_id"),
  ]);

  const courseRows = (courses ?? []) as CourseRow[];
  const enrollmentRows = (enrollments ?? []) as EnrollmentRow[];
  const progressRows = (progress ?? []) as ProgressRow[];
  const attemptRows = (attempts ?? []) as AttemptRow[];
  const completionRows = (completions ?? []) as CompletionRow[];
  const certificateRows = (certificates ?? []) as CertificateRow[];
  const lessonRows = (lessons ?? []) as LessonRow[];
  const moduleRows = (modules ?? []) as ModuleRow[];
  const quizRows = (quizzes ?? []) as QuizRow[];

  const activeEnrollments = enrollmentRows.filter((row) => row.status === "active").length;
  const completedCourses = completionRows.length;
  const publishedCourses = courseRows.filter((course) => course.is_published).length;
  const quizAttempts = attemptRows.length;
  const passedAttempts = attemptRows.filter((attempt) => attempt.passed).length;
  const averageQuizScore = quizAttempts
    ? attemptRows.reduce((sum, attempt) => sum + Number(attempt.percentage || 0), 0) / quizAttempts
    : 0;
  const passRate = quizAttempts ? (passedAttempts / quizAttempts) * 100 : 0;

  const moduleCourse = new Map(moduleRows.map((module) => [module.id, module.course_id]));
  const lessonCourse = new Map(
    lessonRows.map((lesson) => [lesson.id, moduleCourse.get(lesson.module_id) ?? ""]),
  );
  const quizCourse = new Map(quizRows.map((quiz) => [quiz.id, quiz.course_id]));
  const courseMap = new Map(courseRows.map((course) => [course.id, course]));

  const completedLessonsByCourse = new Map<string, number>();
  for (const row of progressRows) {
    const courseId = lessonCourse.get(row.lesson_id);
    if (!courseId) continue;
    completedLessonsByCourse.set(courseId, (completedLessonsByCourse.get(courseId) ?? 0) + 1);
  }

  const lessonsByCourse = new Map<string, number>();
  for (const lesson of lessonRows) {
    const courseId = moduleCourse.get(lesson.module_id);
    if (!courseId) continue;
    lessonsByCourse.set(courseId, (lessonsByCourse.get(courseId) ?? 0) + 1);
  }

  const enrollmentByCourse = new Map<string, number>();
  const activeEnrollmentByCourse = new Map<string, number>();
  for (const row of enrollmentRows) {
    enrollmentByCourse.set(row.course_id, (enrollmentByCourse.get(row.course_id) ?? 0) + 1);
    if (row.status === "active") {
      activeEnrollmentByCourse.set(row.course_id, (activeEnrollmentByCourse.get(row.course_id) ?? 0) + 1);
    }
  }

  const courseAttempts = new Map<string, { count: number; total: number; passed: number }>();
  for (const attempt of attemptRows) {
    const courseId = quizCourse.get(attempt.quiz_id);
    if (!courseId) continue;
    const current = courseAttempts.get(courseId) ?? { count: 0, total: 0, passed: 0 };
    current.count += 1;
    current.total += Number(attempt.percentage || 0);
    if (attempt.passed) current.passed += 1;
    courseAttempts.set(courseId, current);
  }

  const topCourses = courseRows
    .map((course) => {
      const attempt = courseAttempts.get(course.id);
      const totalLessons = lessonsByCourse.get(course.id) ?? 0;
      const completedLessons = completedLessonsByCourse.get(course.id) ?? 0;
      return {
        ...course,
        enrollments: enrollmentByCourse.get(course.id) ?? 0,
        activeEnrollments: activeEnrollmentByCourse.get(course.id) ?? 0,
        lessonCompletion: totalLessons ? (completedLessons / totalLessons) * 100 : 0,
        quizAttempts: attempt?.count ?? 0,
        quizAverage: attempt?.count ? attempt.total / attempt.count : 0,
        quizPassRate: attempt?.count ? (attempt.passed / attempt.count) * 100 : 0,
        certificates: certificateRows.filter((certificate) => certificate.course_id === course.id).length,
      };
    })
    .sort((a, b) => b.enrollments - a.enrollments || b.certificates - a.certificates)
    .slice(0, 8);

  const stats = [
    ["👨‍🎓", "Students", studentCount ?? 0],
    ["📚", "Published Courses", publishedCourses],
    ["🎓", "Active Enrollments", activeEnrollments],
    ["📈", "Course Completions", completedCourses],
    ["📝", "Quiz Attempts", quizAttempts],
    ["🎯", "Average Quiz Score", percent(averageQuizScore)],
    ["✅", "Quiz Pass Rate", percent(passRate)],
    ["🏆", "Certificates", certificateRows.length],
  ];

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="dashboard-label">TECH KING CLASSES</p>
          <h1>Analytics Dashboard</h1>
          <p>Track learning activity, course performance and student outcomes.</p>
        </div>
        <div className="admin-header-actions">
          <Link href="/admin" className="secondary-button">← Admin Dashboard</Link>
          <Link href="/admin/students" className="primary-button">View Students</Link>
        </div>
      </header>

      <section className="admin-stats-grid analytics-stats-grid">
        {stats.map(([icon, label, value]) => (
          <div className="admin-stat-card" key={String(label)}>
            <span>{icon}</span>
            <div>
              <p>{label}</p>
              <strong>{value}</strong>
            </div>
          </div>
        ))}
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <p className="dashboard-label">COURSE PERFORMANCE</p>
            <h2>Course Analytics</h2>
          </div>
          <p>{courseRows.length} total courses · {moduleRows.length} modules · {lessonRows.length} lessons · {quizRows.length} quizzes</p>
        </div>

        {topCourses.length === 0 ? (
          <div className="admin-empty-state">No courses available yet.</div>
        ) : (
          <div className="analytics-course-grid">
            {topCourses.map((course) => (
              <article className="analytics-course-card" key={course.id}>
                <div className="analytics-course-heading">
                  <div>
                    <h3>{course.title}</h3>
                    <span>{course.is_published ? "Published" : "Draft"}</span>
                  </div>
                  <strong>{course.enrollments}</strong>
                </div>
                <p className="analytics-muted">Total enrollments</p>

                <div className="analytics-progress-row">
                  <div className="analytics-progress-label"><span>Lesson activity</span><b>{percent(course.lessonCompletion)}</b></div>
                  <div className="progress-bar"><div className="progress-bar-fill" style={{ width: percent(course.lessonCompletion) }} /></div>
                </div>

                <div className="analytics-mini-grid">
                  <div><span>Active</span><b>{course.activeEnrollments}</b></div>
                  <div><span>Quiz attempts</span><b>{course.quizAttempts}</b></div>
                  <div><span>Quiz avg.</span><b>{percent(course.quizAverage)}</b></div>
                  <div><span>Certificates</span><b>{course.certificates}</b></div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="admin-section analytics-two-column">
        <div className="analytics-panel">
          <p className="dashboard-label">LEARNING HEALTH</p>
          <h2>Key Indicators</h2>
          <div className="analytics-indicator-list">
            <div><span>Active enrollment rate</span><strong>{enrollmentRows.length ? percent((activeEnrollments / enrollmentRows.length) * 100) : "0%"}</strong></div>
            <div><span>Course completion rate</span><strong>{studentCount ? percent((completedCourses / Number(studentCount)) * 100) : "0%"}</strong></div>
            <div><span>Quiz pass rate</span><strong>{percent(passRate)}</strong></div>
            <div><span>Certificate conversion</span><strong>{completedCourses ? percent((certificateRows.length / completedCourses) * 100) : "0%"}</strong></div>
          </div>
        </div>

        <div className="analytics-panel">
          <p className="dashboard-label">QUICK ACTIONS</p>
          <h2>Manage Data</h2>
          <div className="analytics-links">
            <Link href="/admin/courses">📚 Manage Courses →</Link>
            <Link href="/admin/content">🧩 Manage Content →</Link>
            <Link href="/admin/quizzes">📝 Manage Quizzes →</Link>
            <Link href="/admin/students">👨‍🎓 Manage Students →</Link>
            <Link href="/admin/enrollments">🎓 View Enrollments →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
