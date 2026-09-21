"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Course = { id: string; title: string; slug: string };
type Module = { id: string; course_id: string; title: string; description: string | null; sort_order: number };
type Lesson = { id: string; module_id: string; title: string; slug: string; description: string | null; video_url: string | null; notes_url: string | null; sort_order: number; is_free_preview: boolean };

function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s-]+/g, "-").replace(/^-+|-+$/g, ""); }

export default function ContentManager({ courses, initialModules, initialLessons }: { courses: Course[]; initialModules: Module[]; initialLessons: Lesson[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [modules, setModules] = useState(initialModules);
  const [lessons, setLessons] = useState(initialLessons);
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [moduleId, setModuleId] = useState(initialModules.find(m => m.course_id === courses[0]?.id)?.id ?? "");
  const [moduleForm, setModuleForm] = useState({ title: "", description: "", sort_order: "0" });
  const [lessonForm, setLessonForm] = useState({ title: "", slug: "", description: "", video_url: "", notes_url: "", sort_order: "0", is_free_preview: "false" });
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const courseModules = modules.filter(m => m.course_id === courseId).sort((a,b) => a.sort_order-b.sort_order);
  const activeModule = courseModules.find(m => m.id === moduleId);
  const moduleLessons = lessons.filter(l => l.module_id === moduleId).sort((a,b) => a.sort_order-b.sort_order);

  function selectCourse(id: string) {
    setCourseId(id);
    setModuleId(modules.find(m => m.course_id === id)?.id ?? "");
    resetForms();
  }
  function resetForms() { setEditingModule(null); setEditingLesson(null); setModuleForm({title:"",description:"",sort_order:"0"}); setLessonForm({title:"",slug:"",description:"",video_url:"",notes_url:"",sort_order:"0",is_free_preview:"false"}); setError(""); }
  function notify(text: string) { setMessage(text); setTimeout(() => setMessage(""), 2500); }

  async function saveModule(e: React.FormEvent) {
    e.preventDefault(); if (!courseId || !moduleForm.title.trim()) return; setBusy(true); setError("");
    const payload = { course_id: courseId, title: moduleForm.title.trim(), description: moduleForm.description.trim() || null, sort_order: Number(moduleForm.sort_order) || 0 };
    const result = editingModule ? await supabase.from("modules").update(payload).eq("id", editingModule).select().single() : await supabase.from("modules").insert(payload).select().single();
    setBusy(false); if (result.error) { setError(result.error.message); return; }
    if (editingModule) setModules(prev => prev.map(m => m.id === editingModule ? result.data : m)); else { setModules(prev => [...prev, result.data]); setModuleId(result.data.id); }
    resetForms(); notify(editingModule ? "Module updated." : "Module created.");
  }

  async function deleteModule(id: string) {
    if (!confirm("Delete this module and all its lessons?")) return; setBusy(true); setError("");
    const { error: err } = await supabase.from("modules").delete().eq("id", id); setBusy(false); if (err) { setError(err.message); return; }
    setModules(prev => prev.filter(m => m.id !== id)); setLessons(prev => prev.filter(l => l.module_id !== id)); if (moduleId === id) setModuleId(""); notify("Module deleted.");
  }

  async function saveLesson(e: React.FormEvent) {
    e.preventDefault(); if (!moduleId || !lessonForm.title.trim()) return; setBusy(true); setError("");
    const payload = { module_id: moduleId, title: lessonForm.title.trim(), slug: slugify(lessonForm.slug || lessonForm.title), description: lessonForm.description.trim() || null, video_url: lessonForm.video_url.trim() || null, notes_url: lessonForm.notes_url.trim() || null, sort_order: Number(lessonForm.sort_order) || 0, is_free_preview: lessonForm.is_free_preview === "true" };
    const result = editingLesson ? await supabase.from("lessons").update(payload).eq("id", editingLesson).select().single() : await supabase.from("lessons").insert(payload).select().single();
    setBusy(false); if (result.error) { setError(result.error.message); return; }
    if (editingLesson) setLessons(prev => prev.map(l => l.id === editingLesson ? result.data : l)); else setLessons(prev => [...prev, result.data]);
    resetForms(); notify(editingLesson ? "Lesson updated." : "Lesson created.");
  }

  async function deleteLesson(id: string) {
    if (!confirm("Delete this lesson?")) return; setBusy(true); setError("");
    const { error: err } = await supabase.from("lessons").delete().eq("id", id); setBusy(false); if (err) { setError(err.message); return; }
    setLessons(prev => prev.filter(l => l.id !== id)); notify("Lesson deleted.");
  }

  return <>
    {message && <div className="admin-success-card">✓ {message}</div>}
    {error && <div className="admin-error-card"><strong>Action failed</strong><p>{error}</p></div>}
    <section className="admin-section content-toolbar">
      <label>Course<select value={courseId} onChange={e => selectCourse(e.target.value)}>{courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
      <span className="admin-count">{courseModules.length} modules · {lessons.filter(l => courseModules.some(m => m.id === l.module_id)).length} lessons</span>
    </section>

    <section className="content-manager-grid">
      <div className="admin-panel">
        <div className="admin-panel-heading"><div><p className="dashboard-label">LEVEL 1</p><h2>Modules</h2></div><button className="secondary-button" onClick={resetForms}>+ New</button></div>
        <div className="content-list">{courseModules.map(m => <div key={m.id} className={`content-list-item ${moduleId === m.id ? "active" : ""}`} onClick={() => { setModuleId(m.id); setEditingLesson(null); }}><div><strong>{m.title}</strong><small>{m.description || "No description"}</small></div><div className="content-actions"><button onClick={e => { e.stopPropagation(); setEditingModule(m.id); setModuleForm({title:m.title,description:m.description ?? "",sort_order:String(m.sort_order)}); }}>Edit</button><button onClick={e => { e.stopPropagation(); deleteModule(m.id); }}>Delete</button></div></div>)}{!courseModules.length && <p className="admin-empty">No modules yet.</p>}</div>
        <form className="admin-form compact-form" onSubmit={saveModule}><h3>{editingModule ? "Edit Module" : "Add Module"}</h3><input placeholder="Module title" value={moduleForm.title} onChange={e=>setModuleForm({...moduleForm,title:e.target.value})} required/><textarea placeholder="Description" value={moduleForm.description} onChange={e=>setModuleForm({...moduleForm,description:e.target.value})}/><input type="number" placeholder="Order" value={moduleForm.sort_order} onChange={e=>setModuleForm({...moduleForm,sort_order:e.target.value})}/><button className="primary-button" disabled={busy}>{busy ? "Saving..." : editingModule ? "Update Module" : "Create Module"}</button></form>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-heading"><div><p className="dashboard-label">LEVEL 2</p><h2>Lessons {activeModule ? `— ${activeModule.title}` : ""}</h2></div></div>
        {activeModule ? <>
          <div className="content-list">{moduleLessons.map(l => <div key={l.id} className="content-list-item"><div><strong>{l.title}</strong><small>{l.video_url ? "🎥 Video" : "No video"} · {l.notes_url ? "📄 Notes" : "No notes"} · {l.is_free_preview ? "Free preview" : "Protected"}</small></div><div className="content-actions"><button onClick={()=>{setEditingLesson(l.id);setLessonForm({title:l.title,slug:l.slug,description:l.description??"",video_url:l.video_url??"",notes_url:l.notes_url??"",sort_order:String(l.sort_order),is_free_preview:String(l.is_free_preview)})}}>Edit</button><button onClick={()=>deleteLesson(l.id)}>Delete</button></div></div>)}{!moduleLessons.length && <p className="admin-empty">No lessons in this module.</p>}</div>
          <form className="admin-form compact-form" onSubmit={saveLesson}><h3>{editingLesson ? "Edit Lesson" : "Add Lesson"}</h3><input placeholder="Lesson title" value={lessonForm.title} onChange={e=>setLessonForm({...lessonForm,title:e.target.value})} required/><input placeholder="Slug (optional)" value={lessonForm.slug} onChange={e=>setLessonForm({...lessonForm,slug:e.target.value})}/><textarea placeholder="Lesson description" value={lessonForm.description} onChange={e=>setLessonForm({...lessonForm,description:e.target.value})}/><input placeholder="YouTube / video URL" value={lessonForm.video_url} onChange={e=>setLessonForm({...lessonForm,video_url:e.target.value})}/><input placeholder="Notes / PDF URL" value={lessonForm.notes_url} onChange={e=>setLessonForm({...lessonForm,notes_url:e.target.value})}/><div className="admin-form-row"><input type="number" placeholder="Order" value={lessonForm.sort_order} onChange={e=>setLessonForm({...lessonForm,sort_order:e.target.value})}/><select value={lessonForm.is_free_preview} onChange={e=>setLessonForm({...lessonForm,is_free_preview:e.target.value})}><option value="false">Protected lesson</option><option value="true">Free preview</option></select></div><button className="primary-button" disabled={busy}>{busy ? "Saving..." : editingLesson ? "Update Lesson" : "Create Lesson"}</button></form>
        </> : <p className="admin-empty">Select a module to manage its lessons.</p>}
      </div>
    </section>
  </>;
}
