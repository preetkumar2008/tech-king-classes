import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ certificateId: string }>;
};

export default async function VerifyCertificatePage({
  params,
}: Props) {
  const { certificateId } = await params;

  const supabase = await createClient();

  const { data } = await supabase.rpc("verify_certificate", {
    p_certificate_id: certificateId,
  });

  const certificate = Array.isArray(data) ? data[0] : data;

  if (!certificate) {
    return (
      <main className="page-container certificate-verify-page">
        <section className="certificate-invalid">
          <div className="certificate-status-icon">❌</div>

          <span className="eyebrow">Certificate Verification</span>

          <h1>Certificate Not Found</h1>

          <p>
            The certificate ID you entered could not be verified.
          </p>

          <Link href="/certificates" className="secondary-button">
            Back to Certificates
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-container certificate-verify-page">
      <section className="certificate-document">
        <div className="certificate-border">
          <div className="certificate-header">
            <div className="certificate-logo">TK</div>

            <span>TECH KING CLASSES</span>

            <small>TECHNOLOGY FOR EVERYONE</small>
          </div>

          <div className="certificate-content">
            <span className="certificate-label">
              CERTIFICATE OF COMPLETION
            </span>

            <h1>Certificate of Achievement</h1>

            <p className="certificate-intro">
              This certificate is proudly presented to
            </p>

            <h2>{certificate.student_name}</h2>

            <p className="certificate-intro">
              for successfully completing the course
            </p>

            <h3>{certificate.course_name}</h3>

            <div className="certificate-details">
              <div>
                <span>Instructor</span>
                <strong>{certificate.instructor_name}</strong>
              </div>

              <div>
                <span>Issue Date</span>
                <strong>
                  {new Date(
                    certificate.issued_at
                  ).toLocaleDateString("en-IN")}
                </strong>
              </div>

              <div>
                <span>Certificate ID</span>
                <strong>{certificate.certificate_id}</strong>
              </div>
            </div>

            <div className="certificate-footer">
              <div>
                <strong>Preet Kumar</strong>
                <span>Instructor</span>
              </div>

              <div className="certificate-verified">
                ✓ Verified Certificate
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="certificate-actions">
        <button
          type="button"
          className="primary-button"
          onClick={() => window.print()}
        >
          Print / Save PDF
        </button>

        <Link href="/certificates" className="secondary-button">
          My Certificates
        </Link>
      </div>
    </main>
  );
}