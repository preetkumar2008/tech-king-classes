"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Course = { id: string; title: string };
type Module = { id: string; course_id: string; title: string };
type Quiz = { id: string; course_id: string; module_id: string | null; title: string; description: string | null; quiz_type: "module" | "final"; passing_percentage: number; time_limit_minutes: number | null; randomize_questions: boolean; randomize_options: boolean; is_published: boolean };
type Question = { id: string; quiz_id: string; question_text: string; explanation: string | null; sort_order: number };
type Option = { id: string; question_id: string; option_text: string; sort_order: number; is_correct: boolean };
type AnswerKey = { question_id: string; correct_option_id: string };

type Props = { courses: Course[]; modules: Module[]; initialQuizzes: Quiz[]; initialQuestions: Question[]; initialOptions: Option[]; initialAnswerKeys: AnswerKey[] };

const blankQuiz = { title: "", description: "", quiz_type: "module" as "module" | "final", course_id: "", module_id: "", passing_percentage: "60", time_limit_minutes: "", randomize_questions: true, randomize_options: true, is_published: false };
const blankQuestion = { question_text: "", explanation: "", sort_order: "0" };

export default function QuizManager({ courses, modules, initialQuizzes, initialQuestions, initialOptions, initialAnswerKeys }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [quizzes, setQuizzes] = useState(initialQuizzes);
  const [questions, setQuestions] = useState(initialQuestions);
  const [options, setOptions] = useState(initialOptions);
  const [answerKeys, setAnswerKeys] = useState(initialAnswerKeys);
  const [quizForm, setQuizForm] = useState({ ...blankQuiz, course_id: courses[0]?.id ?? "" });
  const [questionForm, setQuestionForm] = useState(blankQuestion);
  const [optionTexts, setOptionTexts] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [selectedQuizId, setSelectedQuizId] = useState(initialQuizzes[0]?.id ?? "");
  const [editingQuiz, setEditingQuiz] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [editingOptionIds, setEditingOptionIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedQuiz = quizzes.find(q => q.id === selectedQuizId);
  const quizQuestions = questions.filter(q => q.quiz_id === selectedQuizId).sort((a, b) => a.sort_order - b.sort_order);
  const courseModules = modules.filter(m => m.course_id === quizForm.course_id);

  function notify(text: string) { setMessage(text); setTimeout(() => setMessage(""), 2600); }
  function resetQuizForm() { setEditingQuiz(null); setQuizForm({ ...blankQuiz, course_id: quizForm.course_id || courses[0]?.id || "" }); }
  function resetQuestionForm() { setEditingQuestion(null); setEditingOptionIds([]); setQuestionForm(blankQuestion); setOptionTexts(["", "", "", ""]); setCorrectIndex(0); }
  function setErr(text: string) { setError(text); }

  async function saveQuiz(e: React.FormEvent) {
    e.preventDefault();
    if (!quizForm.course_id || !quizForm.title.trim()) return;
    setBusy(true); setErr("");
    const payload = {
      course_id: quizForm.course_id,
      module_id: quizForm.quiz_type === "final" ? null : (quizForm.module_id || null),
      title: quizForm.title.trim(),
      description: quizForm.description.trim() || null,
      quiz_type: quizForm.quiz_type,
      passing_percentage: Math.min(100, Math.max(1, Number(quizForm.passing_percentage) || 60)),
      time_limit_minutes: quizForm.time_limit_minutes ? Math.max(1, Number(quizForm.time_limit_minutes)) : null,
      randomize_questions: quizForm.randomize_questions,
      randomize_options: quizForm.randomize_options,
      is_published: quizForm.is_published,
    };
    const result = editingQuiz
      ? await supabase.from("quizzes").update(payload).eq("id", editingQuiz).select().single()
      : await supabase.from("quizzes").insert(payload).select().single();
    setBusy(false);
    if (result.error) { setErr(result.error.message); return; }
    if (editingQuiz) setQuizzes(prev => prev.map(q => q.id === editingQuiz ? result.data : q));
    else { setQuizzes(prev => [result.data, ...prev]); setSelectedQuizId(result.data.id); }
    resetQuizForm(); notify(editingQuiz ? "Quiz updated." : "Quiz created.");
  }

  function editQuiz(quiz: Quiz) {
    setEditingQuiz(quiz.id);
    setQuizForm({ title: quiz.title, description: quiz.description ?? "", quiz_type: quiz.quiz_type, course_id: quiz.course_id, module_id: quiz.module_id ?? "", passing_percentage: String(quiz.passing_percentage), time_limit_minutes: quiz.time_limit_minutes ? String(quiz.time_limit_minutes) : "", randomize_questions: quiz.randomize_questions, randomize_options: quiz.randomize_options, is_published: quiz.is_published });
  }

  async function deleteQuiz(id: string) {
    if (!confirm("Delete this quiz and all its questions?")) return;
    setBusy(true); setErr("");
    const { error: err } = await supabase.from("quizzes").delete().eq("id", id);
    setBusy(false); if (err) { setErr(err.message); return; }
    setQuizzes(prev => prev.filter(q => q.id !== id));
    setQuestions(prev => prev.filter(q => q.quiz_id !== id));
    setSelectedQuizId(prev => prev === id ? (quizzes.find(q => q.id !== id)?.id ?? "") : prev);
    notify("Quiz deleted.");
  }

  async function saveQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedQuizId || !questionForm.question_text.trim() || optionTexts.filter(Boolean).length < 2) { setErr("Question aur kam se kam 2 options required hain."); return; }
    setBusy(true); setErr("");
    const questionPayload = { quiz_id: selectedQuizId, question_text: questionForm.question_text.trim(), explanation: questionForm.explanation.trim() || null, sort_order: Number(questionForm.sort_order) || 0 };
    const questionResult = editingQuestion
      ? await supabase.from("quiz_questions").update(questionPayload).eq("id", editingQuestion).select().single()
      : await supabase.from("quiz_questions").insert(questionPayload).select().single();
    if (questionResult.error) { setBusy(false); setErr(questionResult.error.message); return; }
    const questionId = questionResult.data.id;

    if (editingQuestion) {
      for (let i = 0; i < editingOptionIds.length; i++) {
        const id = editingOptionIds[i];
        const text = optionTexts[i]?.trim();
        if (text) {
          const update = await supabase.from("quiz_options").update({ option_text: text, sort_order: i, is_correct: false }).eq("id", id);
          if (update.error) { setBusy(false); setErr(update.error.message); return; }
        }
      }
      const existingCount = editingOptionIds.length;
      for (let i = existingCount; i < optionTexts.length; i++) {
        const text = optionTexts[i]?.trim();
        if (text) {
          const inserted = await supabase.from("quiz_options").insert({ question_id: questionId, option_text: text, sort_order: i, is_correct: false }).select().single();
          if (inserted.error) { setBusy(false); setErr(inserted.error.message); return; }
          setOptions(prev => [...prev, inserted.data]);
        }
      }
      const removeIds = editingOptionIds.filter((id, i) => !optionTexts[i]?.trim());
      if (removeIds.length) {
        const removed = await supabase.from("quiz_options").delete().in("id", removeIds);
        if (removed.error) { setBusy(false); setErr(removed.error.message); return; }
      }
    } else {
      const inserts = optionTexts.map((text, i) => text.trim() ? { question_id: questionId, option_text: text.trim(), sort_order: i, is_correct: false } : null).filter(Boolean) as { question_id: string; option_text: string; sort_order: number; is_correct: boolean }[];
      const inserted = await supabase.from("quiz_options").insert(inserts).select();
      if (inserted.error) { setBusy(false); setErr(inserted.error.message); return; }
      setOptions(prev => [...prev, ...inserted.data]);
      if (inserted.data[correctIndex]) setCorrectIndex(inserted.data.findIndex(o => o.sort_order === correctIndex));
    }

    const refreshed = await supabase.from("quiz_options").select("id, question_id, option_text, sort_order, is_correct").eq("question_id", questionId).order("sort_order");
    if (refreshed.error) { setBusy(false); setErr(refreshed.error.message); return; }
    const refreshedOptions = refreshed.data ?? [];
    setOptions(prev => [...prev.filter(o => o.question_id !== questionId), ...refreshedOptions]);
    const selected = refreshedOptions[Math.min(correctIndex, Math.max(0, refreshedOptions.length - 1))];
    if (!selected) { setBusy(false); setErr("Correct option select nahi hua."); return; }
    const keyResult = await supabase.from("quiz_answer_keys").upsert({ question_id: questionId, correct_option_id: selected.id });
    if (keyResult.error) { setBusy(false); setErr(`Question save hua, lekin answer key save nahi hui: ${keyResult.error.message}`); return; }
    setAnswerKeys(prev => [...prev.filter(k => k.question_id !== questionId), { question_id: questionId, correct_option_id: selected.id }]);

    if (editingQuestion) setQuestions(prev => prev.map(q => q.id === questionId ? questionResult.data : q));
    else setQuestions(prev => [...prev, questionResult.data]);
    setBusy(false); resetQuestionForm(); notify(editingQuestion ? "Question updated." : "Question created.");
  }

  function editQuestion(q: Question) {
    const opts = options.filter(o => o.question_id === q.id).sort((a,b)=>a.sort_order-b.sort_order);
    const key = answerKeys.find(k => k.question_id === q.id);
    setEditingQuestion(q.id); setEditingOptionIds(opts.map(o => o.id));
    setQuestionForm({ question_text: q.question_text, explanation: q.explanation ?? "", sort_order: String(q.sort_order) });
    setOptionTexts([0,1,2,3].map(i => opts[i]?.option_text ?? ""));
    setCorrectIndex(Math.max(0, opts.findIndex(o => o.id === key?.correct_option_id)));
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Delete this question and its options?")) return;
    setBusy(true); setErr("");
    const { error: err } = await supabase.from("quiz_questions").delete().eq("id", id);
    setBusy(false); if (err) { setErr(err.message); return; }
    setQuestions(prev => prev.filter(q => q.id !== id)); setOptions(prev => prev.filter(o => o.question_id !== id)); setAnswerKeys(prev => prev.filter(k => k.question_id !== id));
    if (editingQuestion === id) resetQuestionForm(); notify("Question deleted.");
  }

  async function togglePublish(quiz: Quiz) {
    setBusy(true); setErr("");
    const { data, error: err } = await supabase.from("quizzes").update({ is_published: !quiz.is_published }).eq("id", quiz.id).select().single();
    setBusy(false); if (err) { setErr(err.message); return; }
    setQuizzes(prev => prev.map(q => q.id === quiz.id ? data : q)); notify(data.is_published ? "Quiz published." : "Quiz unpublished.");
  }

  return <>
    {message && <div className="admin-success-card">✓ {message}</div>}
    {error && <div className="admin-error-card"><strong>Action failed</strong><p>{error}</p></div>}

    <section className="quiz-admin-grid">
      <div className="admin-panel">
        <div className="admin-panel-heading"><div><p className="dashboard-label">TESTS</p><h2>Quizzes</h2></div><button className="secondary-button" onClick={resetQuizForm}>+ New Quiz</button></div>
        <div className="content-list">
          {quizzes.map(q => <div key={q.id} className={`content-list-item ${selectedQuizId === q.id ? "active" : ""}`} onClick={() => { setSelectedQuizId(q.id); resetQuestionForm(); }}>
            <div><strong>{q.title}</strong><small>{q.quiz_type === "final" ? "Final" : "Module"} · {q.passing_percentage}% pass · {q.is_published ? "Published" : "Draft"}</small></div>
            <div className="content-actions"><button onClick={e=>{e.stopPropagation(); editQuiz(q);}}>Edit</button><button onClick={e=>{e.stopPropagation(); togglePublish(q);}}>{q.is_published ? "Unpublish" : "Publish"}</button><button onClick={e=>{e.stopPropagation(); deleteQuiz(q.id);}}>Delete</button></div>
          </div>)}
          {!quizzes.length && <p className="admin-empty">No quizzes yet.</p>}
        </div>
        <form className="admin-form compact-form" onSubmit={saveQuiz}>
          <h3>{editingQuiz ? "Edit Quiz" : "Create Quiz"}</h3>
          <label>Title<input value={quizForm.title} onChange={e=>setQuizForm({...quizForm,title:e.target.value})} placeholder="e.g. Computer Fundamentals Final Test" required/></label>
          <label>Course<select value={quizForm.course_id} onChange={e=>setQuizForm({...quizForm,course_id:e.target.value,module_id:""})}>{courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
          <label>Type<select value={quizForm.quiz_type} onChange={e=>setQuizForm({...quizForm,quiz_type:e.target.value as "module"|"final",module_id:""})}><option value="module">Module Quiz</option><option value="final">Final Exam</option></select></label>
          {quizForm.quiz_type === "module" && <label>Module<select value={quizForm.module_id} onChange={e=>setQuizForm({...quizForm,module_id:e.target.value})}><option value="">Select module</option>{courseModules.map(m=><option key={m.id} value={m.id}>{m.title}</option>)}</select></label>}
          <label>Description<textarea value={quizForm.description} onChange={e=>setQuizForm({...quizForm,description:e.target.value})} placeholder="Short instructions for students"/></label>
          <div className="admin-form-row"><label>Passing %<input type="number" min="1" max="100" value={quizForm.passing_percentage} onChange={e=>setQuizForm({...quizForm,passing_percentage:e.target.value})}/></label><label>Time limit (minutes)<input type="number" min="1" value={quizForm.time_limit_minutes} onChange={e=>setQuizForm({...quizForm,time_limit_minutes:e.target.value})} placeholder="Optional"/></label></div>
          <div className="admin-toggle-row"><label className="admin-check-label"><input type="checkbox" checked={quizForm.randomize_questions} onChange={e=>setQuizForm({...quizForm,randomize_questions:e.target.checked})}/><span><strong>Randomize questions</strong><small>Show questions in a random order.</small></span></label><label className="admin-check-label"><input type="checkbox" checked={quizForm.randomize_options} onChange={e=>setQuizForm({...quizForm,randomize_options:e.target.checked})}/><span><strong>Randomize options</strong><small>Shuffle answer choices.</small></span></label></div>
          <label className="admin-check-label"><input type="checkbox" checked={quizForm.is_published} onChange={e=>setQuizForm({...quizForm,is_published:e.target.checked})}/><span><strong>Publish quiz</strong><small>Students can access published quizzes.</small></span></label>
          <div className="admin-form-actions"><button type="button" className="secondary-button" onClick={resetQuizForm}>Clear</button><button className="primary-button" disabled={busy}>{busy ? "Saving..." : editingQuiz ? "Update Quiz" : "Create Quiz"}</button></div>
        </form>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-heading"><div><p className="dashboard-label">QUESTION BANK</p><h2>{selectedQuiz ? selectedQuiz.title : "Select a quiz"}</h2></div></div>
        {selectedQuiz ? <>
          <div className="quiz-admin-meta"><span>{selectedQuiz.quiz_type === "final" ? "Final Exam" : "Module Quiz"}</span><span>Pass {selectedQuiz.passing_percentage}%</span><span>{quizQuestions.length} Questions</span>{selectedQuiz.time_limit_minutes && <span>{selectedQuiz.time_limit_minutes} min</span>}</div>
          <div className="content-list">
            {quizQuestions.map((q, idx) => { const opts = options.filter(o=>o.question_id===q.id).sort((a,b)=>a.sort_order-b.sort_order); const key=answerKeys.find(k=>k.question_id===q.id); return <div key={q.id} className="quiz-question-admin-card"><div><strong>Q{idx+1}. {q.question_text}</strong><small>{opts.length} options · Correct answer: {opts.find(o=>o.id===key?.correct_option_id)?.option_text ?? "Not set"}</small></div><div className="content-actions"><button onClick={()=>editQuestion(q)}>Edit</button><button onClick={()=>deleteQuestion(q.id)}>Delete</button></div></div>; })}
            {!quizQuestions.length && <p className="admin-empty">No questions yet. Add the first question below.</p>}
          </div>
          <form className="admin-form compact-form" onSubmit={saveQuestion}>
            <h3>{editingQuestion ? "Edit Question" : "Add Question"}</h3>
            <label>Question<input value={questionForm.question_text} onChange={e=>setQuestionForm({...questionForm,question_text:e.target.value})} placeholder="Write the question" required/></label>
            <div className="quiz-options-editor">{optionTexts.map((text,i)=><label key={i}>Option {String.fromCharCode(65+i)}<div className="quiz-option-input"><input value={text} onChange={e=>setOptionTexts(prev=>prev.map((v,idx)=>idx===i?e.target.value:v))} placeholder={`Option ${String.fromCharCode(65+i)}`} /><input aria-label={`Correct option ${i+1}`} type="radio" name="correct-option" checked={correctIndex===i} onChange={()=>setCorrectIndex(i)} title="Mark as correct" /></div></label>)}</div>
            <label>Explanation (optional)<textarea value={questionForm.explanation} onChange={e=>setQuestionForm({...questionForm,explanation:e.target.value})} placeholder="Explain the correct answer"/></label>
            <label>Question order<input type="number" value={questionForm.sort_order} onChange={e=>setQuestionForm({...questionForm,sort_order:e.target.value})}/></label>
            <div className="admin-form-actions"><button type="button" className="secondary-button" onClick={resetQuestionForm}>Clear</button><button className="primary-button" disabled={busy}>{busy ? "Saving..." : editingQuestion ? "Update Question" : "Add Question"}</button></div>
          </form>
        </> : <div className="admin-empty-card"><span>📝</span><h3>Create or select a quiz</h3><p>Then build its question bank here.</p></div>}
      </div>
    </section>
  </>;
}
