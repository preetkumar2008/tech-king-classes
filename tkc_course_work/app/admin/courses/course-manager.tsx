"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Course = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  thumbnail_url: string | null;
  level: string;
  language: string;
  duration: string | null;
  is_free: boolean;
  price: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

type CourseForm = {
  title: string;
  slug: string;
  short_description: string;
  description: string;
  thumbnail_url: string;
  level: string;
  language: string;
  duration: string;
  is_free: boolean;
  price: string;
  is_published: boolean;
};

const emptyForm: CourseForm = {
  title: "",
  slug: "",
  short_description: "",
  description: "",
  thumbnail_url: "",
  level: "Beginner",
  language: "Hindi/Hinglish",
  duration: "Self Paced",
  is_free: true,
  price: "0",
  is_published: false,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatPrice(price: number, isFree: boolean) {
  if (isFree) return "Free";
  return `₹${Number(price).toLocaleString("en-IN")}`;
}

export default function CourseManager({ initialCourses }: { initialCourses: Course[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [courses, setCourses] = useState(initialCourses);
  const [form, setForm] = useState<CourseForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredCourses = courses.filter((course) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return [course.title, course.slug, course.level, course.language]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));
  });

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
    setShowForm(true);
  }

  function openEdit(course: Course) {
    setEditingId(course.id);
    setForm({
      title: course.title,
      slug: course.slug,
      short_description: course.short_description ?? "",
      description: course.description ?? "",
      thumbnail_url: course.thumbnail_url ?? "",
      level: course.level,
      language: course.language,
      duration: course.duration ?? "",
      is_free: course.is_free,
      price: String(course.price ?? 0),
      is_published: course.is_published,
    });
    setMessage("");
    setError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    if (saving) return;
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function updateField<K extends keyof CourseForm>(field: K, value: CourseForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const title = form.title.trim();
    const slug = slugify(form.slug || title);
    const price = form.is_free ? 0 : Number(form.price);

    if (!title) {
      setError("Course title is required.");
      setSaving(false);
      return;
    }

    if (!slug) {
      setError("Please provide a valid course title or slug.");
      setSaving(false);
      return;
    }

    if (!form.is_free && (!Number.isFinite(price) || price < 0)) {
      setError("Please enter a valid course price.");
      setSaving(false);
      return;
    }

    const payload = {
      title,
      slug,
      short_description: form.short_description.trim() || null,
      description: form.description.trim() || null,
      thumbnail_url: form.thumbnail_url.trim() || null,
      level: form.level,
      language: form.language.trim() || "Hindi/Hinglish",
      duration: form.duration.trim() || null,
      is_free: form.is_free,
      price,
      is_published: form.is_published,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { data, error: updateError } = await supabase
        .from("courses")
        .update(payload)
        .eq("id", editingId)
        .select()
        .single();

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      setCourses((current) => current.map((course) => (course.id === editingId ? data as Course : course)));
      setMessage("Course updated successfully.");
    } else {
      const { data, error: insertError } = await supabase
        .from("courses")
        .insert(payload)
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }

      setCourses((current) => [data as Course, ...current]);
      setMessage("Course created successfully.");
    }

    setSaving(false);
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  }

  async function togglePublished(course: Course) {
    setError("");
    setMessage("");

    const { data, error: updateError } = await supabase
      .from("courses")
      .update({ is_published: !course.is_published, updated_at: new Date().toISOString() })
      .eq("id", course.id)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setCourses((current) => current.map((item) => (item.id === course.id ? data as Course : item)));
    setMessage(course.is_published ? "Course unpublished." : "Course published.");
  }

  async function deleteCourse(course: Course) {
    const confirmed = window.confirm(
      `Delete "${course.title}"? This will also delete its modules, lessons and related course content. This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(course.id);
    setError("");
    setMessage("");

    const { error: deleteError } = await supabase
      .from("courses")
      .delete()
      .eq("id", course.id);

    if (deleteError) {
      setError(deleteError.message);
      setDeletingId(null);
      return;
    }

    setCourses((current) => current.filter((item) => item.id !== course.id));
    setMessage("Course deleted successfully.");
    setDeletingId(null);
  }

  return (
    <>
      <section className="admin-course-toolbar">
        <div>
          <p className="dashboard-label">COURSE LIBRARY</p>
          <h2>{courses.length} Course{courses.length === 1 ? "" : "s"}</h2>
          <p>Create your course once, then add modules and lessons from the next management screen.</p>
        </div>
        <div className="admin-course-toolbar-actions">
          <input
            className="admin-search-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search courses..."
            aria-label="Search courses"
          />
          <button type="button" className="primary-button admin-button" onClick={openCreate}>+ Add Course</button>
        </div>
      </section>

      {message ? <div className="admin-success-card">✓ {message}</div> : null}
      {error ? <div className="admin-error-card">⚠ {error}</div> : null}

      {showForm ? (
        <section className="admin-form-card">
          <div className="admin-form-heading">
            <div>
              <p className="dashboard-label">{editingId ? "EDIT COURSE" : "NEW COURSE"}</p>
              <h2>{editingId ? "Update Course" : "Create a Course"}</h2>
            </div>
            <button type="button" className="secondary-button" onClick={closeForm} disabled={saving}>Cancel</button>
          </div>

          <form onSubmit={saveCourse} className="admin-course-form">
            <label>
              Course Title *
              <input value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="e.g. Python Basics" required />
            </label>

            <label>
              Slug
              <input value={form.slug} onChange={(event) => updateField("slug", slugify(event.target.value))} placeholder="python-basics" />
              <small>Used in the course URL: /courses/python-basics</small>
            </label>

            <label className="admin-form-full">
              Short Description
              <input value={form.short_description} onChange={(event) => updateField("short_description", event.target.value)} placeholder="A short description for course cards" />
            </label>

            <label className="admin-form-full">
              Full Description
              <textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} rows={5} placeholder="Explain what students will learn in this course..." />
            </label>

            <label>
              Level
              <select value={form.level} onChange={(event) => updateField("level", event.target.value)}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
                <option>Beginner to Advanced</option>
              </select>
            </label>

            <label>
              Language
              <input value={form.language} onChange={(event) => updateField("language", event.target.value)} placeholder="Hindi/Hinglish" />
            </label>

            <label>
              Duration
              <input value={form.duration} onChange={(event) => updateField("duration", event.target.value)} placeholder="e.g. 12 Months / Self Paced" />
            </label>

            <label>
              Thumbnail URL
              <input type="url" value={form.thumbnail_url} onChange={(event) => updateField("thumbnail_url", event.target.value)} placeholder="https://..." />
            </label>

            <div className="admin-toggle-row">
              <label className="admin-check-label">
                <input type="checkbox" checked={form.is_free} onChange={(event) => updateField("is_free", event.target.checked)} />
                <span><strong>Free Course</strong><small>Students can start without payment.</small></span>
              </label>
              <label className="admin-check-label">
                <input type="checkbox" checked={form.is_published} onChange={(event) => updateField("is_published", event.target.checked)} />
                <span><strong>Published</strong><small>Visible on the public Courses page.</small></span>
              </label>
            </div>

            {!form.is_free ? (
              <label>
                Price (₹)
                <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => updateField("price", event.target.value)} placeholder="0" />
              </label>
            ) : null}

            <div className="admin-form-actions admin-form-full">
              <button type="button" className="secondary-button" onClick={closeForm} disabled={saving}>Cancel</button>
              <button type="submit" className="primary-button admin-button" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Save Changes" : "Create Course"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="admin-course-list">
        {filteredCourses.length === 0 ? (
          <div className="admin-empty-card">
            <span>📚</span>
            <h3>{courses.length === 0 ? "No courses yet" : "No matching courses"}</h3>
            <p>{courses.length === 0 ? "Create your first course to start building the Tech King Classes LMS." : "Try another search term."}</p>
            {courses.length === 0 ? <button type="button" className="primary-button admin-button" onClick={openCreate}>+ Create First Course</button> : null}
          </div>
        ) : (
          filteredCourses.map((course) => (
            <article className="admin-course-card" key={course.id}>
              <div className="admin-course-card-media">
                {course.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={course.thumbnail_url} alt="" />
                ) : (
                  <span>📚</span>
                )}
              </div>
              <div className="admin-course-card-body">
                <div className="admin-course-card-topline">
                  <div>
                    <h3>{course.title}</h3>
                    <p>/{course.slug}</p>
                  </div>
                  <span className={course.is_published ? "admin-status published" : "admin-status draft"}>
                    {course.is_published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="admin-course-description">{course.short_description || "No short description added yet."}</p>
                <div className="admin-course-meta">
                  <span>{course.level}</span>
                  <span>{course.language}</span>
                  <span>{course.duration || "No duration"}</span>
                  <strong>{formatPrice(Number(course.price), course.is_free)}</strong>
                </div>
                <div className="admin-course-actions">
                  <button type="button" className="secondary-button" onClick={() => openEdit(course)}>Edit</button>
                  <button type="button" className="secondary-button" onClick={() => togglePublished(course)}>
                    {course.is_published ? "Unpublish" : "Publish"}
                  </button>
                  <button type="button" className="danger-button" onClick={() => deleteCourse(course)} disabled={deletingId === course.id}>
                    {deletingId === course.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </>
  );
}
