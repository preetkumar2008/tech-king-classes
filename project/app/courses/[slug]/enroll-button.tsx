"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EnrollButton({
  courseId,
  isFree,
  isEnrolled,
}: {
  courseId: string;
  isFree: boolean;
  isEnrolled: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (isEnrolled) {
    return <a href="#course-content" className="start-learning-button">Continue Learning →</a>;
  }

  async function enroll() {
    setLoading(true);
    setMessage("");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      router.push(`/login?next=/courses`);
      return;
    }

    if (!isFree) {
      setMessage("Online payment is being prepared. This course will be available after payment setup.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.rpc("enroll_free_course", { p_course_id: courseId });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <button onClick={enroll} disabled={loading} className="start-learning-button">
        {loading ? "Enrolling..." : isFree ? "Enroll Free →" : "Buy Now →"}
      </button>
      {message && <p className="enrollment-message">{message}</p>}
    </div>
  );
}
