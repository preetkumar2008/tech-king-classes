"use client";

import { useMemo, useState } from "react";

type Student = {
  id: string; full_name: string; mobile: string; email?: string | null; profile_photo_url?: string | null;
  role: string; created_at: string; progressCount: number; quizAttempts: number; passedQuizzes: number; completions: number; certificates: number;
};
type Details = {
  progress: { user_id: string; lesson_id: string; completed: boolean; completed_at: string | null }[];
  attempts: { id: string; user_id: string; quiz_id: string; score: number; total_questions: number; correct_answers: number; percentage: number; passed: boolean; submitted_at: string | null; started_at: string }[];
  completions: { id: string; user_id: string; course_id: string; completed_at: string }[];
  certificates: { id: string; user_id: string; certificate_id: string; course_id: string; course_name: string; issued_at: string }[];
  lessons: { id: string; title: string; module_id: string }[];
  quizzes: { id: string; title: string; course_id: string }[];
  courses: { id: string; title: string }[];
};

export default function StudentManager({ students, details }: { students: Student[]; details: Details }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => [s.full_name, s.mobile, s.email ?? ""].join(" ").toLowerCase().includes(q));
  }, [query, students]);

  const selected = students.find((s) => s.id === selectedId) ?? null;
  const selectedProgress = selected ? details.progress.filter((p) => p.user_id === selected.id && p.completed) : [];
  const selectedAttempts = selected ? details.attempts.filter((a) => a.user_id === selected.id) : [];
  const selectedCompletions = selected ? details.completions.filter((c) => c.user_id === selected.id) : [];
  const selectedCertificates = selected ? details.certificates.filter((c) => c.user_id === selected.id) : [];

  const courseName = (id: string) => details.courses.find((c) => c.id === id)?.title ?? "Course";
  const quizName = (id: string) => details.quizzes.find((q) => q.id === id)?.title ?? "Quiz";
  const lessonName = (id: string) => details.lessons.find((l) => l.id === id)?.title ?? "Lesson";

  return (
    <>
      <section className="admin-course-toolbar">
        <div><p className="dashboard-label">REGISTERED LEARNERS</p><h2>{students.length} Students</h2><p>Search and open a student to inspect their LMS activity.</p></div>
        <input className="admin-search-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, mobile or email..." />
      </section>

      <section className="admin-student-layout">
        <div className="admin-student-list">
          {filtered.length === 0 ? <div className="admin-empty-card">No students found.</div> : filtered.map((s) => (
            <button type="button" key={s.id} className={`admin-student-row ${selectedId === s.id ? "active" : ""}`} onClick={() => setSelectedId(s.id)}>
              <span className="student-avatar">{s.full_name?.charAt(0)?.toUpperCase() || "S"}</span>
              <span className="student-row-main"><strong>{s.full_name || "Unnamed Student"}</strong><small>{s.mobile}{s.email ? ` · ${s.email}` : ""}</small></span>
              <span className="student-row-stats"><b>{s.progressCount}</b><small>lessons</small></span>
            </button>
          ))}
        </div>

        <div className="admin-student-detail">
          {!selected ? <div className="admin-empty-card student-detail-empty"><span>👨‍🎓</span><h3>Select a student</h3><p>Choose a student from the list to view their learning details.</p></div> : (
            <>
              <div className="student-detail-header">
                <div className="student-avatar large">{selected.full_name?.charAt(0)?.toUpperCase() || "S"}</div>
                <div><p className="dashboard-label">STUDENT PROFILE</p><h2>{selected.full_name || "Unnamed Student"}</h2><p>{selected.email || "Email not available"} · {selected.mobile}</p><small>Joined {new Date(selected.created_at).toLocaleDateString()}</small></div>
              </div>
              <div className="student-detail-stats">
                <div><strong>{selected.progressCount}</strong><span>Lessons Completed</span></div>
                <div><strong>{selected.quizAttempts}</strong><span>Quiz Attempts</span></div>
                <div><strong>{selected.passedQuizzes}</strong><span>Passed Quizzes</span></div>
                <div><strong>{selected.completions}</strong><span>Completed Courses</span></div>
                <div><strong>{selected.certificates}</strong><span>Certificates</span></div>
              </div>

              <div className="student-detail-section"><h3>Completed Courses</h3>{selectedCompletions.length ? selectedCompletions.map((c) => <div className="student-activity-row" key={c.id}><span>📚</span><div><strong>{courseName(c.course_id)}</strong><small>{new Date(c.completed_at).toLocaleDateString()}</small></div><em>Completed</em></div>) : <p className="admin-muted">No completed courses yet.</p>}</div>
              <div className="student-detail-section"><h3>Quiz Attempts</h3>{selectedAttempts.length ? [...selectedAttempts].sort((a,b) => (b.submitted_at ?? b.started_at).localeCompare(a.submitted_at ?? a.started_at)).slice(0, 10).map((a) => <div className="student-activity-row" key={a.id}><span>📝</span><div><strong>{quizName(a.quiz_id)}</strong><small>{a.correct_answers}/{a.total_questions} correct · {a.percentage}%</small></div><em className={a.passed ? "status-good" : "status-bad"}>{a.passed ? "Passed" : "Not Passed"}</em></div>) : <p className="admin-muted">No quiz attempts yet.</p>}</div>
              <div className="student-detail-section"><h3>Certificates</h3>{selectedCertificates.length ? selectedCertificates.map((c) => <div className="student-activity-row" key={c.id}><span>🏆</span><div><strong>{c.course_name}</strong><small>{c.certificate_id} · {new Date(c.issued_at).toLocaleDateString()}</small></div><a href={`/certificates/verify/${c.certificate_id}`} target="_blank" rel="noreferrer">View</a></div>) : <p className="admin-muted">No certificates issued yet.</p>}</div>
              <div className="student-detail-section"><h3>Recent Lesson Activity</h3>{selectedProgress.length ? selectedProgress.slice(-10).reverse().map((p) => <div className="student-activity-row" key={p.lesson_id}><span>✅</span><div><strong>{lessonName(p.lesson_id)}</strong><small>{p.completed_at ? new Date(p.completed_at).toLocaleString() : "Completed"}</small></div></div>) : <p className="admin-muted">No completed lessons yet.</p>}</div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
