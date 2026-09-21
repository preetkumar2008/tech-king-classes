"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Option = {
  id: string;
  option_text: string;
  sort_order: number;
};

type Question = {
  id: string;
  question_text: string;
  options: Option[];
};

type Props = {
  quizId: string;
  questions: Question[];
  passingPercentage: number;
};

export default function QuizForm({
  quizId,
  questions,
  passingPercentage,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function selectAnswer(questionId: string, optionId: string) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: optionId,
    }));
  }

  async function handleSubmit() {
    setError("");

    if (Object.keys(answers).length !== questions.length) {
      setError("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);

    const payload = questions.map((question) => ({
      question_id: question.id,
      selected_option_id: answers[question.id],
    }));

    const { data, error: submitError } = await supabase.rpc(
      "submit_quiz",
      {
        p_quiz_id: quizId,
        p_answers: payload,
      }
    );

    if (submitError) {
      setError(submitError.message || "Unable to submit test.");
      setSubmitting(false);
      return;
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (!result?.attempt_id) {
      setError("Test submitted, but result could not be loaded.");
      setSubmitting(false);
      return;
    }

    router.push(`/tests/result/${result.attempt_id}`);
  }

  return (
    <section className="quiz-form">
      {questions.map((question, index) => (
        <article className="quiz-question" key={question.id}>
          <div className="question-number">
            Question {index + 1} of {questions.length}
          </div>

          <h2>{question.question_text}</h2>

          <div className="quiz-options">
            {question.options.map((option) => {
              const selected = answers[question.id] === option.id;

              return (
                <label
                  key={option.id}
                  className={`quiz-option ${
                    selected ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={option.id}
                    checked={selected}
                    onChange={() =>
                      selectAnswer(question.id, option.id)
                    }
                  />

                  <span>{option.option_text}</span>
                </label>
              );
            })}
          </div>
        </article>
      ))}

      {error && <div className="quiz-error">{error}</div>}

      <div className="quiz-submit-area">
        <p>
          Passing score: <strong>{passingPercentage}%</strong>
        </p>

        <button
          type="button"
          className="primary-button"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Test →"}
        </button>
      </div>
    </section>
  );
}