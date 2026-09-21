import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MarkCompleteButton from "./mark-complete-button";

type LessonPageProps = {
  params: Promise<{
    courseSlug: string;
    lessonSlug: string;
  }>;
};

export default async function LessonPage({
  params,
}: LessonPageProps) {
  const { courseSlug, lessonSlug } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?next=/learn/${courseSlug}/${lessonSlug}`
    );
  }

  const { data: course, error } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      slug,
      modules (
        id,
        title,
        sort_order,
        lessons (
          id,
          title,
          slug,
          description,
          video_url,
          notes_url,
          sort_order,
          is_free_preview
        )
      )
    `)
    .eq("slug", courseSlug)
    .eq("is_published", true)
    .single();

  if (error || !course) {
    notFound();
  }

  const modules = [...(course.modules || [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  const allLessons = modules
    .flatMap((module) =>
      [...(module.lessons || [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((lesson) => ({
          ...lesson,
          moduleTitle: module.title,
        }))
    );

  const lessonIndex = allLessons.findIndex(
    (lesson) => lesson.slug === lessonSlug
  );

  if (lessonIndex === -1) {
    notFound();
  }

  const lesson = allLessons[lessonIndex];

  const previousLesson =
    lessonIndex > 0 ? allLessons[lessonIndex - 1] : null;

  const nextLesson =
    lessonIndex < allLessons.length - 1
      ? allLessons[lessonIndex + 1]
      : null;

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("completed")
    .eq("user_id", user.id)
    .eq("lesson_id", lesson.id)
    .maybeSingle();

  return (
    <main className="lesson-page">
      <header className="lesson-header">
        <div>
          <Link
            href={`/courses/${course.slug}`}
            className="lesson-back-link"
          >
            ← Back to {course.title}
          </Link>

          <p className="lesson-course-name">
            {course.title}
          </p>
        </div>

        <div className="lesson-progress-status">
          {progress?.completed ? "✓ Completed" : "In Progress"}
        </div>
      </header>

      <div className="lesson-layout">
        <aside className="lesson-sidebar">
          <h2>Course Content</h2>

          {modules.map((module, moduleIndex) => {
            const lessons = [...(module.lessons || [])].sort(
              (a, b) => a.sort_order - b.sort_order
            );

            return (
              <div className="sidebar-module" key={module.id}>
                <h3>
                  {moduleIndex + 1}. {module.title}
                </h3>

                {lessons.map((item) => (
                  <Link
                    key={item.id}
                    href={`/learn/${course.slug}/${item.slug}`}
                    className={
                      item.id === lesson.id
                        ? "sidebar-lesson active"
                        : "sidebar-lesson"
                    }
                  >
                    <span>
                      {item.id === lesson.id ? "▶" : "○"}
                    </span>

                    {item.title}
                  </Link>
                ))}
              </div>
            );
          })}
        </aside>

        <section className="lesson-main">
          <div className="lesson-title-section">
            <p className="courses-label">
              {lesson.moduleTitle}
            </p>

            <h1>{lesson.title}</h1>

            {lesson.description && (
              <p>{lesson.description}</p>
            )}
          </div>

          <div className="video-container">
            {lesson.video_url ? (
              <iframe
                src={getEmbedUrl(lesson.video_url)}
                title={lesson.title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
              <div className="video-placeholder">
                <span>▶</span>
                <h2>Lesson Video</h2>
                <p>
                  Video will be available here soon.
                </p>
              </div>
            )}
          </div>

          <div className="lesson-actions">
            <MarkCompleteButton
              lessonId={lesson.id}
              courseId={course.id}
              completed={Boolean(progress?.completed)}
            />

            {lesson.notes_url && (
              <a
                href={lesson.notes_url}
                target="_blank"
                rel="noopener noreferrer"
                className="notes-button"
              >
                📄 Open Notes / PDF
              </a>
            )}
          </div>

          <div className="lesson-navigation">
            {previousLesson ? (
              <Link
                href={`/learn/${course.slug}/${previousLesson.slug}`}
                className="navigation-button"
              >
                ← Previous Lesson
              </Link>
            ) : (
              <span />
            )}

            {nextLesson && (
              <Link
                href={`/learn/${course.slug}/${nextLesson.slug}`}
                className="navigation-button primary"
              >
                Next Lesson →
              </Link>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function getEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      const videoId = parsed.searchParams.get("v");
      if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}`;

      const pathParts = parsed.pathname.split("/").filter(Boolean);
      if (pathParts[0] === "embed" && pathParts[1]) {
        return `https://www.youtube-nocookie.com/embed/${pathParts[1]}`;
      }
      if (pathParts[0] === "shorts" && pathParts[1]) {
        return `https://www.youtube-nocookie.com/embed/${pathParts[1]}`;
      }
    }

    if (hostname === "youtu.be") {
      const videoId = parsed.pathname.slice(1).split("/")[0];
      if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}`;
    }

    if (hostname === "vimeo.com" || hostname === "player.vimeo.com") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const videoId = parts.at(-1);
      if (videoId && /^\d+$/.test(videoId)) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }

    return url;
  } catch {
    return url;
  }
}
