import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";

export default async function StudentDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Student profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, mobile, profile_photo_url")
    .eq("id", user.id)
    .single();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id,title,message,type,publish_at")
    .order("publish_at", { ascending: false })
    .limit(4);

  // Published courses + modules + lessons
  const { data: courses } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      slug,
      short_description,
      thumbnail_url,
      level,
      duration,
      is_free,
      price,
      modules (
        id,
        lessons (
          id,
          title,
          slug,
          sort_order
        )
      )
    `)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  // Student's completed lessons
  const { data: progressRows } = await supabase
    .from("lesson_progress")
    .select("lesson_id, completed, completed_at")
    .eq("user_id", user.id)
    .eq("completed", true);

  const { data: certificates } = await supabase
    .from("certificates")
    .select("certificate_id, course_name, issued_at")
    .eq("user_id", user.id)
    .order("issued_at", { ascending: false });

  const { data: completionRows } = await supabase
    .from("course_completions")
    .select("course_id, completed_at")
    .eq("user_id", user.id);

  const completedCourseIds = new Set(
    (completionRows || []).map((item) => item.course_id)
  );

  const completedLessonIds = new Set(
    (progressRows || []).map((item) => item.lesson_id)
  );

  const courseProgress = (courses || []).map((course) => {
    const allLessons = (course.modules || []).flatMap(
      (module) => module.lessons || []
    );

    const totalLessons = allLessons.length;

    const completedLessons = allLessons.filter((lesson) =>
      completedLessonIds.has(lesson.id)
    ).length;

    const progress =
      totalLessons > 0
        ? Math.round(
            (completedLessons / totalLessons) * 100
          )
        : 0;

    const nextLesson = allLessons.find(
      (lesson) => !completedLessonIds.has(lesson.id)
    );

    return {
      ...course,
      totalLessons,
      completedLessons,
      progress,
      nextLesson,
      isCompleted: completedCourseIds.has(course.id),
    };
  });

  const totalCompletedLessons = completedLessonIds.size;

  const totalCourses = courseProgress.length;

  const completedCourses = courseProgress.filter(
    (course) => course.isCompleted
  ).length;

  const activeCourses = courseProgress.filter(
    (course) =>
      course.completedLessons > 0 &&
      course.progress < 100
  );

  const continueCourse =
    activeCourses.find((course) => course.nextLesson) ||
    courseProgress.find(
      (course) => course.nextLesson
    );

  const name = profile?.full_name || "Student";

  return (
    <main className="student-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div>
          <p className="dashboard-label">
            TECH KING CLASSES
          </p>

          <h1>Student Dashboard</h1>

          <p>
            Welcome back, {name} 👋
          </p>
        </div>

        <LogoutButton />
      </header>

      {/* Profile */}
      <section className="profile-card">
        <div>
          <span>Student Name</span>
          <strong>{name}</strong>
        </div>

        <div>
          <span>Email</span>
          <strong>{user.email}</strong>
        </div>

        <div>
          <span>Mobile</span>
          <strong>
            {profile?.mobile || "Not available"}
          </strong>
        </div>
      </section>

      {/* Statistics */}
      <section className="dashboard-grid">
        <div className="dashboard-card">
          <span>📚</span>
          <h2>My Courses</h2>
          <strong>{totalCourses}</strong>
          <p>Available courses</p>
        </div>

        <div className="dashboard-card">
          <span>▶️</span>
          <h2>Lessons Completed</h2>
          <strong>{totalCompletedLessons}</strong>
          <p>Lessons completed</p>
        </div>

        <div className="dashboard-card">
          <span>🚀</span>
          <h2>Active Learning</h2>
          <strong>{activeCourses.length}</strong>
          <p>Courses in progress</p>
        </div>

        <div className="dashboard-card">
          <span>🏆</span>
          <h2>Completed Courses</h2>
          <strong>{completedCourses}</strong>
          <p>Courses completed</p>
        </div>
      </section>

      {/* Notifications */}
      <section className="dashboard-section-card">
        <div className="section-heading-row"><div><p className="dashboard-label">LATEST UPDATES</p><h2>Notifications</h2></div><Link href="/student/notifications" className="secondary-button">View All</Link></div>
        {(notifications || []).length === 0 ? (
          <p className="admin-muted">No new announcements right now.</p>
        ) : (
          <div className="dashboard-notification-list">
            {(notifications || []).map((notification) => (
              <article className={`dashboard-notification-item ${notification.type}`} key={notification.id}>
                <span>{notification.type === "live" ? "🔴" : notification.type === "warning" ? "⚠️" : notification.type === "success" ? "✅" : "🔔"}</span>
                <div><strong>{notification.title}</strong><p>{notification.message}</p><small>{new Date(notification.publish_at).toLocaleString()}</small></div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Continue Learning */}
      {continueCourse &&
        continueCourse.nextLesson && (
          <section className="continue-learning-card">
            <div>
              <p className="dashboard-label">
                CONTINUE LEARNING
              </p>

              <h2>{continueCourse.title}</h2>

              <p>
                Continue with:{" "}
                <strong>
                  {continueCourse.nextLesson.title}
                </strong>
              </p>

              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${continueCourse.progress}%`,
                  }}
                />
              </div>

              <span className="progress-text">
                {continueCourse.progress}% completed
              </span>
            </div>

            <Link
              href={`/learn/${continueCourse.slug}/${continueCourse.nextLesson.slug}`}
              className="continue-button"
            >
              Continue Learning →
            </Link>
          </section>
        )}

      {/* My Learning */}
      <section className="my-learning-section">
        <div className="section-heading">
          <div>
            <p className="dashboard-label">
              MY LEARNING
            </p>

            <h2>Courses</h2>
          </div>

          <Link href="/courses">
            Explore All Courses →
          </Link>
        </div>

        {courseProgress.length === 0 ? (
          <div className="empty-learning">
            <h3>No courses available</h3>

            <p>
              Courses will appear here when they are
              published.
            </p>
          </div>
        ) : (
          <div className="learning-grid">
            {courseProgress.map((course) => (
              <article
                className="learning-course-card"
                key={course.id}
              >
                <div className="learning-thumbnail">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                    />
                  ) : (
                    <span>TK</span>
                  )}
                </div>

                <div className="learning-course-content">
                  <div className="course-meta">
                    <span>{course.level}</span>

                    {course.is_free && (
                      <span>FREE</span>
                    )}
                  </div>

                  <h3>{course.title}</h3>

                  <p>
                    {course.short_description ||
                      "Continue learning with Tech King Classes."}
                  </p>

                  <div className="dashboard-progress">
                    <div className="progress-header">
                      <span>Progress</span>

                      <strong>
                        {course.progress}%
                      </strong>
                    </div>

                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${course.progress}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="learning-card-footer">
                    <span>
                      {course.completedLessons}/
                      {course.totalLessons} lessons
                    </span>

                    {course.isCompleted ? (
                      <Link href="/certificates">
                        🎓 Certificate →
                      </Link>
                    ) : course.nextLesson ? (
                      <Link
                        href={`/learn/${course.slug}/${course.nextLesson.slug}`}
                      >
                        Continue →
                      </Link>
                    ) : (
                      <Link
                        href={`/courses/${course.slug}`}
                      >
                        View Course →
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* My Certificates */}
      <section className="my-certificates-section">
        <div className="section-heading">
          <div>
            <p className="dashboard-label">ACHIEVEMENTS</p>
            <h2>My Certificates</h2>
          </div>

          <Link href="/certificates">View All Certificates →</Link>
        </div>

        {!certificates || certificates.length === 0 ? (
          <div className="empty-certificates">
            <span>🎓</span>
            <div>
              <h3>Your certificates will appear here</h3>
              <p>Complete a course and pass its final test to earn a Tech King Classes certificate.</p>
            </div>
          </div>
        ) : (
          <div className="certificate-dashboard-grid">
            {certificates.slice(0, 3).map((certificate) => (
              <article className="certificate-dashboard-card" key={certificate.certificate_id}>
                <div className="certificate-dashboard-icon">🎓</div>
                <div>
                  <span className="certificate-dashboard-label">CERTIFICATE</span>
                  <h3>{certificate.course_name}</h3>
                  <p>
                    Issued {new Date(certificate.issued_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <Link href={`/certificates/verify/${certificate.certificate_id}`}>
                  View Certificate →
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}