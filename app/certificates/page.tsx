import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CertificatesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: certificates } = await supabase
    .from("certificates")
    .select(`
      certificate_id,
      student_name,
      course_name,
      instructor_name,
      issued_at
    `)
    .eq("user_id", user.id)
    .order("issued_at", { ascending: false });

  return (
    <main className="page-container certificates-page">
      <section className="page-header">
        <span className="eyebrow">Tech King Classes</span>
        <h1>My Certificates</h1>
        <p>Your completed course certificates.</p>
      </section>

      {!certificates?.length ? (
        <div className="empty-state">
          <div className="certificate-empty-icon">🏆</div>
          <h2>No certificates yet</h2>
          <p>
            Complete a course and pass its final test to earn your
            certificate.
          </p>

          <Link href="/courses" className="primary-button">
            Explore Courses →
          </Link>
        </div>
      ) : (
        <section className="certificate-grid">
          {certificates.map((certificate) => (
            <article
              className="certificate-card"
              key={certificate.certificate_id}
            >
              <div className="certificate-card-top">
                <span>🏆</span>
                <strong>Certificate of Completion</strong>
              </div>

              <h2>{certificate.course_name}</h2>

              <p>
                Awarded to <strong>{certificate.student_name}</strong>
              </p>

              <div className="certificate-meta">
                <span>
                  ID: {certificate.certificate_id}
                </span>

                <span>
                  Issued:{" "}
                  {new Date(certificate.issued_at).toLocaleDateString(
                    "en-IN"
                  )}
                </span>
              </div>

              <Link
                href={`/certificates/verify/${certificate.certificate_id}`}
                className="primary-button"
              >
                View Certificate →
              </Link>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}