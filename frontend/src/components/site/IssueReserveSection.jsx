import { useState } from "react";
import { ArrowRight, MailCheck } from "lucide-react";

import SectionReveal from "@/components/site/SectionReveal";
import { API_BASE_URL } from "@/lib/api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function IssueReserveSection() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setStatus("error");
      setMessage("Enter a valid email address.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/issue-reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          issue_slug: "issue-ii-forging-the-republics-power",
          source: "landing_after_faq",
          website,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Could not reserve your place.");
      }

      setStatus("success");
      setMessage(data.message || "Reserved. You will hear first when Issue II opens.");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Could not reserve your place.");
    }
  };

  return (
    <section id="reserve" className="reserve-section border-t border-steel px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        <SectionReveal>
          <div className="reserve-layout">
            <div className="reserve-copy">
              <p className="reserve-kicker">Issue II {"\u00B7"} July 2026</p>
              <h2 className="reserve-title font-rajdhani font-bold text-chalk">
                Forging the Republic&apos;s <span>Power.</span>
              </h2>
              <p className="reserve-body">
                India is building industrial depth, self-reliance, doctrine and
                jointness at the exact moment the old global order frays and
                technology rewrites how wars are fought. Issue II reads where
                the Republic is strengthening, and where it must sharpen.
              </p>
            </div>

            <form className="reserve-card" onSubmit={handleSubmit}>
              <p className="reserve-card__eyebrow">Reserve your copy</p>
              <h3>Be first to read Issue II.</h3>
              <p>
                Leave your email and we&apos;ll hold your place. You&apos;ll know
                the moment it&apos;s live, before it is announced anywhere else.
              </p>

              <label className="sr-only" htmlFor="issue-reserve-email">
                Email address
              </label>
              <input
                id="issue-reserve-email"
                className="reserve-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
                required
              />
              <input
                className="reserve-honeypot"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                aria-hidden="true"
              />

              <button
                className="reserve-button"
                type="submit"
                disabled={status === "loading"}
              >
                {status === "loading" ? "Holding..." : "Hold my place"}
                {status === "success" ? (
                  <MailCheck className="size-4" />
                ) : (
                  <ArrowRight className="size-4" />
                )}
              </button>

              {message ? (
                <p
                  className={
                    status === "success"
                      ? "reserve-message reserve-message--success"
                      : "reserve-message reserve-message--error"
                  }
                  role="status"
                >
                  {message}
                </p>
              ) : null}

              <p className="reserve-note">No spam. Issue announcements only.</p>
              <p className="reserve-card__footer">
                Issue II contributors include senior officers, builders, scholars
                and strategic practitioners.
              </p>
            </form>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
