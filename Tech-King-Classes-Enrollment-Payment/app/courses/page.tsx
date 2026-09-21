import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function CoursesPage() {
  const supabase = await createClient();

  const { data: courses, error } = await supabase
    .from("courses")
    .select(
      "id, title, slug, short_description, thumbnail_url, level, language, duration, is_free, price"
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return (
    <main className="courses-page">
      <section className="courses-hero">
        <p className="courses-label">TECH KING CLASSES</p>

        <h1>Explore Courses</h1>

        <p>
          Learn technology from Computer Basics to Advanced Technology —
          step by step in Hindi/Hinglish.
        </p>
      </section>

      <section className="courses-container">
        {error && (
          <div className="courses-error">
            Unable to load courses. Please try again.
          </div>
        )}

        {!error && (!courses || courses.length === 0) && (
          <div className="empty-courses">
            <h2>No courses available yet.</h2>
            <p>New courses will be added soon.</p>
          </div>
        )}

        <div className="courses-grid">
          {courses?.map((course) => (
            <article className="course-card" key={course.id}>
              <div className="course-thumbnail">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} />
                ) : (
                  <div className="course-placeholder">
                    TK
                  </div>
                )}
              </div>

              <div className="course-content">
                <div className="course-meta">
                  <span>{course.level}</span>
                  <span>{course.language}</span>
                </div>

                <h2>{course.title}</h2>

                <p>
                  {course.short_description ||
                    "Start learning with Tech King Classes."}
                </p>

                <div className="course-bottom">
                  <strong>
                    {course.is_free
                      ? "FREE"
                      : `₹${Number(course.price).toLocaleString("en-IN")}`}
                  </strong>

                  <Link href={`/courses/${course.slug}`}>
                    View Course →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}