import { useCallback, useEffect, useMemo, useState } from "react";
import {
  SignInButton,
  SignedIn,
  SignedOut,
  useAuth,
} from "@clerk/clerk-react";
import { ArrowRight, Clock, Download, RefreshCw, Save } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { apiRequest, downloadProtectedFile } from "@/lib/api";
import { productForSlug } from "@/data/siteContent";

const emptyProfile = {
  username: "",
  email: "",
  phone_number: "",
  dob: "",
  profile_completed_at: "",
};

const minimumAgeYears = 12;

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function yearsAgo(years) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date;
}

const minimumDobIso = toDateInputValue(yearsAgo(minimumAgeYears));

const statusRank = {
  paid: 1,
  pending: 2,
  failed: 3,
  refunded: 4,
};

function uniqueMagazinesByBestStatus(purchases = []) {
  const bestByMagazine = new Map();

  purchases.forEach((purchase) => {
    const key = purchase.slug || purchase.id || purchase.razorpay_order_id;
    const current = bestByMagazine.get(key);
    const purchaseRank = statusRank[purchase.status] ?? 9;
    const currentRank = statusRank[current?.status] ?? 9;

    if (!current || purchaseRank < currentRank) {
      bestByMagazine.set(key, purchase);
    }
  });

  return Array.from(bestByMagazine.values());
}

function validateProfile(profile) {
  const name = profile.username.trim();
  const email = profile.email.trim();
  const phoneDigits = profile.phone_number.replace(/\D/g, "");
  const dob = profile.dob;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const errors = {};

  if (name.length < 2) {
    errors.username = "Enter your name.";
  }

  if (!emailPattern.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    errors.phone_number = "Enter a valid phone number.";
  }

  if (!dob || Number.isNaN(new Date(dob).getTime())) {
    errors.dob = "Enter a valid date of birth.";
  } else if (dob > minimumDobIso) {
    errors.dob = "Buyer must be at least 12 years old.";
  }

  return errors;
}

function cleanProfile(profile) {
  const phoneDigits = profile.phone_number.replace(/\D/g, "");

  return {
    ...profile,
    username: profile.username.trim(),
    email: profile.email.trim(),
    phone_number: profile.phone_number.trim().startsWith("+")
      ? `+${phoneDigits}`
      : phoneDigits,
  };
}

// "1998-06-30" -> "30 June 1998". Returns the raw value if it is not a date.
function formatDobLabel(value) {
  if (!value) {
    return "";
  }

  const parsed = new Date(`${value}T00:00:00`);

  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
}

function safeRedirectPath(value) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/checkout";
  }

  return value;
}

export default function ProfilePage() {
  return (
    <section className="account-page min-h-screen px-4 pb-16 pt-28 md:px-8">
      <div className="mx-auto max-w-5xl">
        <SignedOut>
          <AuthRequiredPanel />
        </SignedOut>

        <SignedIn>
          <ProfilePanel />
        </SignedIn>
      </div>
    </section>
  );
}

function AuthRequiredPanel() {
  return (
    <div className="account-panel mx-auto max-w-xl p-6 text-center md:p-8">
      <p className="font-plex text-xs font-medium uppercase tracking-[0.18em] text-ember">
        Account
      </p>
      <h1 className="mt-3 font-rajdhani text-4xl font-bold leading-none text-chalk">
        Sign in to complete your profile.
      </h1>
      <p className="mt-4 font-plex text-sm leading-7 text-ash">
        Your profile details are used for order records and magazine access.
      </p>
      <SignInButton mode="modal" forceRedirectUrl="/profile">
        <Button className="signin-button mt-6 h-11 rounded-none px-8 font-rajdhani text-lg font-bold">
          Sign In
        </Button>
      </SignInButton>
    </div>
  );
}

function ProfilePanel() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState(emptyProfile);
  const [magazines, setMagazines] = useState([]);
  const [status, setStatus] = useState("loading");
  const [recoveryStatus, setRecoveryStatus] = useState("idle");
  const [autoRecoveryAttempted, setAutoRecoveryAttempted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [downloadingSlug, setDownloadingSlug] = useState("");
  const [message, setMessage] = useState("");
  const [redirectCountdown, setRedirectCountdown] = useState(null);
  const checkoutRedirect = useMemo(
    () => safeRedirectPath(searchParams.get("redirect")),
    [searchParams]
  );

  const loadProfile = useCallback(
    async (shouldApply = () => true) => {
      try {
        const data = await apiRequest(getToken, "/api/me");

        if (!shouldApply()) return;

        setProfile({
          username: data.user?.username ?? "",
          email: data.user?.email ?? "",
          phone_number: data.user?.phone_number ?? "",
          dob: data.user?.dob ?? "",
          profile_completed_at: data.user?.profile_completed_at ?? "",
        });
        setMagazines(
          uniqueMagazinesByBestStatus(data.user?.magazines_bought ?? [])
        );
        setStatus("ready");
      } catch (error) {
        if (!shouldApply()) return;
        setStatus("error");
        setMessage(error.message);
      }
    },
    [getToken]
  );

  useEffect(() => {
    let active = true;
    const timerId = window.setTimeout(() => {
      loadProfile(() => active);
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timerId);
    };
  }, [loadProfile]);

  const isComplete = useMemo(
    () =>
      profile.username && profile.email && profile.phone_number && profile.dob,
    [profile]
  );
  const profileLocked =
    status === "ready" && Boolean(profile.profile_completed_at);
  const hasPendingPurchase = magazines.some(
    (magazine) => magazine.status === "pending"
  );

  const recoverPendingPayments = useCallback(
    async ({ automatic = false } = {}) => {
      setRecoveryStatus("checking");

      if (!automatic) {
        setMessage("");
      }

      try {
        const data = await apiRequest(
          getToken,
          "/api/payments/razorpay/recover",
          {
            method: "POST",
          }
        );

        setMagazines(
          uniqueMagazinesByBestStatus(data.user?.magazines_bought ?? [])
        );
        setRecoveryStatus("idle");
        setMessage(data.message || "Payment check completed.");
      } catch (error) {
        setRecoveryStatus("error");

        if (!automatic) {
          setMessage(error.message);
        }
      }
    },
    [getToken]
  );

  useEffect(() => {
    if (status !== "ready" || !hasPendingPurchase || autoRecoveryAttempted) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setAutoRecoveryAttempted(true);
      recoverPendingPayments({ automatic: true });
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [
    autoRecoveryAttempted,
    hasPendingPurchase,
    recoverPendingPayments,
    status,
  ]);

  useEffect(() => {
    if (redirectCountdown === null) {
      return undefined;
    }

    if (redirectCountdown <= 0) {
      navigate(checkoutRedirect, { replace: true });
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setRedirectCountdown((current) => (current === null ? null : current - 1));
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [checkoutRedirect, navigate, redirectCountdown]);

  async function handleSubmit(event) {
    event.preventDefault();
    setRedirectCountdown(null);
    const validationErrors = validateProfile(profile);

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setMessage("Please fix the highlighted details.");
      return;
    }

    const profilePayload = cleanProfile(profile);
    setStatus("saving");
    setMessage("");
    setFieldErrors({});

    try {
      const data = await apiRequest(getToken, "/api/me", {
        method: "PUT",
        body: JSON.stringify(profilePayload),
      });
      const completedAt = data.user?.profile_completed_at ?? "";

      setProfile({
        username: data.user?.username ?? "",
        email: data.user?.email ?? "",
        phone_number: data.user?.phone_number ?? "",
        dob: data.user?.dob ?? "",
        profile_completed_at: completedAt,
      });
      setMagazines(
        uniqueMagazinesByBestStatus(data.user?.magazines_bought ?? [])
      );
      setStatus("ready");
      if (completedAt) {
        setRedirectCountdown(3);
        setMessage("Profile saved. Redirecting you to the payment page in 3 seconds.");
      } else {
        setMessage("Profile saved.");
      }
    } catch (error) {
      setStatus("error");
      setMessage(error.message);
    }
  }

  async function downloadMagazine(magazine) {
    if (downloadingSlug) {
      return;
    }

    setDownloadingSlug(magazine.slug);

    try {
      await downloadProtectedFile(
        getToken,
        `/api/magazines/${encodeURIComponent(magazine.slug)}/download`,
        `${magazine.slug}.pdf`
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setDownloadingSlug("");
    }
  }

  const libraryPanel = (
    <div className="profile-download-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-plex text-xs font-medium uppercase tracking-[0.18em] text-ember">
            PDF Library
          </p>
          <h2 className="mt-2 font-rajdhani text-2xl font-bold leading-none text-chalk">
            Bought magazines
          </h2>
        </div>
        {hasPendingPurchase ? (
          <Button
            type="button"
            variant="ghost"
            disabled={recoveryStatus === "checking"}
            className="h-9 rounded-none border border-ember/50 px-3 font-rajdhani text-sm font-bold text-chalk hover:border-ember hover:bg-plate hover:text-chalk"
            onClick={() => recoverPendingPayments()}
          >
            <RefreshCw className="size-4" />
            {recoveryStatus === "checking" ? "Checking" : "Verify Payment"}
          </Button>
        ) : null}
      </div>
      <div className="mt-3 grid gap-3">
        {magazines.length ? (
          magazines.map((magazine) => {
            const issue = productForSlug(magazine.slug);
            const isPaid = magazine.status === "paid";
            const isDownloading = downloadingSlug === magazine.slug;

            const body = (
              <>
                {issue ? (
                  <img
                    src={issue.cover}
                    alt=""
                    className="download-card__cover"
                    loading="lazy"
                  />
                ) : null}
                <span className="download-card__copy">
                  <span className="download-card__issue">
                    {issue?.label ?? "Magazine"}
                  </span>
                  <span className="download-card__title">
                    {issue?.shortTitle ?? magazine.title}
                  </span>
                  <span className="download-card__hint">
                    {!isPaid
                      ? magazine.status
                      : isDownloading
                        ? "Preparing your PDF"
                        : "Download PDF"}
                  </span>
                </span>
                {isPaid ? (
                  isDownloading ? (
                    <span className="download-card__spinner" aria-hidden="true" />
                  ) : (
                    <Download className="download-card__icon size-5" />
                  )
                ) : null}
              </>
            );

            return isPaid ? (
              <button
                key={`${magazine.id}-${magazine.razorpay_order_id}`}
                type="button"
                className="download-card"
                disabled={Boolean(downloadingSlug)}
                aria-busy={isDownloading}
                onClick={() => downloadMagazine(magazine)}
              >
                {body}
              </button>
            ) : (
              <div
                key={`${magazine.id}-${magazine.razorpay_order_id}`}
                className="download-card download-card--pending"
              >
                {body}
              </div>
            );
          })
        ) : (
          <p className="font-plex text-sm text-ash">No paid magazines yet.</p>
        )}
      </div>
    </div>
  );

  // Saved profiles have nothing left to fill in, so the library leads and the
  // details become a read-only summary beside it.
  if (profileLocked) {
    return (
      <div className="profile-layout grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(19rem,0.85fr)]">
        <section className="account-panel profile-card profile-library-panel p-5 md:p-7">
          <p className="font-plex text-xs font-medium uppercase tracking-[0.18em] text-ember">
            Your Library
          </p>
          <h1 className="mt-3 font-rajdhani text-[clamp(2.2rem,7vw,4.5rem)] font-bold leading-none text-chalk">
            Your ADITI issues.
          </h1>
          <p className="mt-4 max-w-2xl font-plex text-sm leading-7 text-ash">
            Every issue you own, ready to download any time.
          </p>

          {libraryPanel}

          {message ? (
            <p className="mt-5 font-plex text-sm text-ember">{message}</p>
          ) : null}
        </section>

        <aside className="account-panel profile-side-panel profile-details-panel p-5 md:p-7">
          <p className="font-plex text-xs font-medium uppercase tracking-[0.18em] text-ember">
            Your Details
          </p>
          <h2 className="mt-2 font-rajdhani text-2xl font-bold leading-none text-chalk">
            {profile.username}
          </h2>

          <dl className="profile-summary mt-5">
            <div className="profile-summary__row">
              <dt>Email</dt>
              <dd>{profile.email}</dd>
            </div>
            <div className="profile-summary__row">
              <dt>Phone</dt>
              <dd>{profile.phone_number}</dd>
            </div>
            <div className="profile-summary__row">
              <dt>Date of birth</dt>
              <dd>{formatDobLabel(profile.dob)}</dd>
            </div>
          </dl>

          <p className="profile-summary__note">
            These details are locked and used for checkout, receipt email, and
            magazine access. Contact support to change them.
          </p>

          <Button
            asChild
            variant="ghost"
            className="profile-details-cta h-11 w-full rounded-none border border-steel/70 px-5 font-rajdhani text-base font-bold text-chalk hover:border-ember hover:bg-plate hover:text-chalk"
          >
            <Link to={checkoutRedirect}>
              Go to Cart <ArrowRight className="size-4" />
            </Link>
          </Button>

          {redirectCountdown !== null ? (
            <span className="profile-redirect-notice mt-4" role="status" aria-live="polite">
              <Clock className="size-4" />
              Redirecting you to the payment page in {redirectCountdown}
            </span>
          ) : null}
        </aside>
      </div>
    );
  }

  return (
    <div className="profile-layout grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
      <form className="account-panel profile-card p-5 md:p-7" onSubmit={handleSubmit}>
        <p className="font-plex text-xs font-medium uppercase tracking-[0.18em] text-ember">
          User Profile
        </p>
        <h1 className="mt-3 font-rajdhani text-[clamp(2.2rem,7vw,4.5rem)] font-bold leading-none text-chalk">
          Complete your access details.
        </h1>
        <p className="mt-4 max-w-2xl font-plex text-sm leading-7 text-ash">
          These details stay in the PHP/MySQL backend and will be used for
          checkout, receipt email, and magazine access.
        </p>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <ProfileField
            label="Name"
            value={profile.username}
            disabled={profileLocked}
            error={fieldErrors.username}
            minLength={2}
            maxLength={80}
            autoComplete="name"
            onChange={(value) => {
              setProfile((current) => ({ ...current, username: value }));
              setFieldErrors((current) => ({ ...current, username: "" }));
            }}
          />
          <ProfileField
            label="Email"
            type="email"
            value={profile.email}
            disabled={profileLocked}
            error={fieldErrors.email}
            maxLength={255}
            autoComplete="email"
            onChange={(value) => {
              setProfile((current) => ({ ...current, email: value }));
              setFieldErrors((current) => ({ ...current, email: "" }));
            }}
          />
          <ProfileField
            label="Phone Number"
            type="tel"
            value={profile.phone_number}
            disabled={profileLocked}
            error={fieldErrors.phone_number}
            inputMode="tel"
            minLength={10}
            maxLength={20}
            autoComplete="tel"
            onChange={(value) => {
              setProfile((current) => ({ ...current, phone_number: value }));
              setFieldErrors((current) => ({ ...current, phone_number: "" }));
            }}
          />
          <ProfileField
            label="Date of Birth"
            type="date"
            value={profile.dob}
            disabled={profileLocked}
            error={fieldErrors.dob}
            max={minimumDobIso}
            onChange={(value) => {
              setProfile((current) => ({ ...current, dob: value }));
              setFieldErrors((current) => ({ ...current, dob: "" }));
            }}
          />
        </div>

        <div className="profile-actions mt-6 flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            disabled={status === "saving" || profileLocked}
            className="final-button h-11 rounded-none px-6 font-rajdhani text-base font-bold"
          >
            <Save className="size-4" />
            {profileLocked
              ? "Profile Locked"
              : status === "saving"
                ? "Saving"
                : "Save Profile"}
          </Button>
          <Button
            asChild
            variant="ghost"
            className="h-11 rounded-none border border-steel/70 px-5 font-rajdhani text-base font-bold text-chalk hover:border-ember hover:bg-plate hover:text-chalk"
          >
            <Link to={checkoutRedirect}>
              Go to Cart <ArrowRight className="size-4" />
            </Link>
          </Button>
          {redirectCountdown !== null ? (
            <span className="profile-redirect-notice" role="status" aria-live="polite">
              <Clock className="size-4" />
              Redirecting you to the payment page in {redirectCountdown}
            </span>
          ) : message ? (
            <span className="font-plex text-sm text-ember">{message}</span>
          ) : null}
        </div>
      </form>

      <aside className="account-panel profile-side-panel p-5 md:p-7">
        <p className="font-plex text-xs font-medium uppercase tracking-[0.18em] text-ember">
          Readiness
        </p>
        <div className="profile-readiness-card mt-4">
          <p className="font-rajdhani text-2xl font-bold text-chalk">
            {profileLocked ? "Ready" : isComplete ? "Review" : "Incomplete"}
          </p>
          <p className="mt-2 font-plex text-sm leading-6 text-ash">
            {profileLocked
              ? "Saved for checkout."
              : isComplete
                ? "Save to unlock checkout."
                : "Complete the required details."}
          </p>
        </div>
        <div className="profile-action-grid mt-4">
          <div className="profile-action-card profile-action-card--status">
            <span>Profile</span>
            <b>{isComplete ? "Ready" : "Pending"}</b>
          </div>
        </div>
        <div className="mt-6">{libraryPanel}</div>
      </aside>
    </div>
  );
}

function ProfileField({
  label,
  type = "text",
  value,
  disabled = false,
  error = "",
  onChange,
  ...inputProps
}) {
  return (
    <label className={`account-field${error ? " account-field-invalid" : ""}`}>
      <span>{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        aria-invalid={error ? "true" : "false"}
        onChange={(event) => onChange(event.target.value)}
        {...inputProps}
      />
      {error ? <small className="account-field-error">{error}</small> : null}
    </label>
  );
}
