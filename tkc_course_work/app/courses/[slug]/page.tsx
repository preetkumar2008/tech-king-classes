import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type CoursePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CoursePage({
  params,
}: CoursePageProps) {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: course, error } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      slug,
      description,
      short_description,
      thumbnail_url,
      level,
      language,
      duration,
      is_free,
      price,
      modules (
        id,
        title,
        description,
        sort_order,
        lessons (
          id,
          title,
          slug,
          description,
          sort_order,
          is_free_preview
        )
      )
    `)
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !course) {
    notFound();
  }

  const modules = [...(course.modules || [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  return (
    <main className="course-details-page">
      <section className="course-details-hero">
        <div className="course-details-content">
          <Link href="/courses" className="back-link">
            ← All Courses
          </Link>

          <p className="courses-label">
            TECH KING CLASSES
          </p>

          <h1>{course.title}</h1>

          <p className="course-description">
            {course.description ||
              course.short_description}
          </p>

          <div className="course-info-row">
            <span>📊 {course.level}</span>
            <span>🌐 {course.language}</span>
            <span>
              ⏱️ {course.duration || "Self Paced"}
            </span>
          </div>

          <div className="course-enroll-row">
            <strong>
              {course.is_free
                ? "FREE"
                : `₹${Number(course.price).toLocaleString(
                    "en-IN"
                  )}`}
            </strong>

            {course.is_free ? (
              <Link
                href="#course-content"
                className="start-learning-button"
              >
                Start Learning Free
              </Link>
            ) : (
              <button className="start-learning-button">
                Enroll Now
              </button>
            )}
          </div>
        </div>

        <div className="course-details-image">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
            />
          ) : (
            <div className="course-large-placeholder">
              TECH KING
            </div>
          )}
        </div>
      </section>

      <section
        id="course-content"
        className="course-content-section"
      >
        <div className="course-content-header">
          <p className="courses-label">
            COURSE CONTENT
          </p>

          <h2>Modules & Lessons</h2>

          <p>
            Follow the lessons step by step and build your
            technology skills.
          </p>
        </div>

        <div className="modules-list">
          {modules.map((module, moduleIndex) => {
            const lessons = [
              ...(module.lessons || []),
            ].sort(
              (a, b) => a.sort_order - b.sort_order
            );

            return (
              <article
                className="module-card"
                key={module.id}
              >
                <div className="module-header">
                  <div className="module-number">
                    {String(moduleIndex + 1).padStart(
                      2,
                      "0"
                    )}
                  </div>

                  <div>
                    <h3>{module.title}</h3>

                    {module.description && (
                      <p>{module.description}</p>
                    )}
                  </div>
                </div>

                {/* LESSONS */}
                <div className="lessons-list">
                  {lessons.map(
                    (lesson, lessonIndex) => (
                      <div
                        className="lesson-row"
                        key={lesson.id}
                      >
                        <div className="lesson-number">
                          {lessonIndex + 1}
                        </div>

                        <div className="lesson-info">
                          <strong>
                            {lesson.title}
                          </strong>

                          {lesson.description && (
                            <span>
                              {lesson.description}
                            </span>
                          )}
                        </div>

                        <div className="lesson-action">
                          {lesson.is_free_preview ? (
                            <Link
                              href={`/learn/${course.slug}/${lesson.slug}`}
                              className="preview-badge lesson-link"
                            >
                              Start Lesson →
                            </Link>
                          ) : (
                            <span className="locked-badge">
                              🔒
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  )}

                  {lessons.length === 0 && (
                    <p className="no-lessons">
                      Lessons will be added soon.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}