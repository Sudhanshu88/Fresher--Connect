"use client";

import { ChangeEvent, DragEvent, FormEvent, Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthShell } from "@/components/auth-shell";
import { Feedback } from "@/components/feedback";
import { ApiError, apiRequest, writeAccessToken } from "@/lib/api";
import { dashboardPath } from "@/lib/routes";
import { usePlatformStore } from "@/lib/stores/platform-store";
import type { SessionUser } from "@/lib/types";

type RegisterResponse = {
  ok: boolean;
  user: SessionUser;
  access_token?: string;
  message?: string;
  requires_approval?: boolean;
  approval_status?: string;
};

type ProfilePhotoUploadResponse = {
  ok: boolean;
  photo_url: string;
  user: SessionUser;
};

type ResumeUploadResponse = {
  ok: boolean;
  resume_url: string;
  user: SessionUser;
};

const PHOTO_MAX_SIZE = 5 * 1024 * 1024;
const PHOTO_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif"]);
const RESUME_MAX_SIZE = 10 * 1024 * 1024;
const RESUME_EXTENSIONS = new Set(["pdf", "doc", "docx"]);

const defaultForm = {
  role: "fresher",
  name: "",
  email: "",
  password: "",
  education: "",
  grad_year: "",
  skills: "",
  location: "",
  summary: "",
  company_name: "",
  company_website: "",
  company_description: "",
  industry_type: "",
  company_size: ""
};

const roleContent = {
  fresher: {
    label: "Candidate Registration",
    title: "Build a recruiter-ready profile in minutes.",
    description: "Create a polished professional profile, upload your resume, and start applying to verified graduate opportunities with confidence.",
    noteTitle: "Candidate onboarding",
    noteBody: "Once your profile is live, you can explore roles, apply faster, and track every stage from one dashboard.",
    loginHref: "/login",
    loginText: "Sign in to your candidate account"
  },
  company: {
    label: "Employer Registration",
    title: "Create a trusted hiring hub for your team.",
    description: "Set up your employer profile, share your hiring goals, and prepare your recruiter workspace for verification.",
    noteTitle: "Employer onboarding",
    noteBody: "Verified employer accounts unlock professional job posting, candidate review, and structured hiring coordination.",
    loginHref: "/login?role=company",
    loginText: "Sign in to recruiter workspace"
  }
} as const;

const registerErrorMessages: Record<string, string> = {
  invalid_role: "Please choose whether you are creating a candidate or company account.",
  name_required: "Enter your full name before continuing.",
  email_required: "Enter your email address before continuing.",
  password_too_short: "Use a password with at least 8 characters.",
  email_already_registered: "This email is already registered. Sign in instead or use a different email.",
  company_name_required: "Enter your registered company name before continuing.",
  grad_year_required: "Enter your graduation year before continuing.",
  education_required: "Enter your highest qualification before continuing."
};

function readServerRegisterMessage(error: ApiError) {
  const payload = error.payload;

  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const payloadMessage = (payload as { message?: unknown }).message;
    if (typeof payloadMessage === "string" && payloadMessage.trim()) {
      return payloadMessage.trim();
    }
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }

  const fallbackMessage = error.message.trim();
  if (
    !fallbackMessage ||
    fallbackMessage === "Request failed" ||
    fallbackMessage === `Request failed with status ${error.status}` ||
    /^[a-z0-9_]+$/i.test(fallbackMessage)
  ) {
    return "";
  }

  return fallbackMessage;
}

function resolveRegisterErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const payload = error.payload;
    const errorCode =
      typeof payload === "object" && payload !== null && "error" in payload
        ? String((payload as { error?: string }).error || "").trim()
        : "";

    if (errorCode && registerErrorMessages[errorCode]) {
      return registerErrorMessages[errorCode];
    }

    const serverMessage = readServerRegisterMessage(error);
    if (error.status === 502 || error.status === 504) {
      return serverMessage
        ? `Registration service is temporarily unreachable. ${serverMessage}`
        : "Registration service is temporarily unreachable. Please try again in a few minutes.";
    }

    if (error.status === 503) {
      return serverMessage
        ? `Registration service is temporarily unavailable. ${serverMessage}`
        : "Registration service is temporarily unavailable. Please try again in a few minutes.";
    }

    if (error.status >= 500) {
      return serverMessage
        ? `The server could not create your account right now. ${serverMessage}`
        : "The server could not create your account right now. Please try again shortly.";
    }
  }

  return "We couldn't create your account. Please review the form details and try again.";
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-shell">
          <section className="auth-card auth-card-strong">
            <div className="empty-state">Preparing your registration journey...</div>
          </section>
        </main>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = usePlatformStore((state) => state.user);
  const setUser = usePlatformStore((state) => state.setUser);
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"default" | "error" | "success">("default");
  const [submitting, setSubmitting] = useState(false);
  const [candidatePhotoFile, setCandidatePhotoFile] = useState<File | null>(null);
  const [candidatePhotoPreview, setCandidatePhotoPreview] = useState("");
  const [photoDragActive, setPhotoDragActive] = useState(false);
  const [candidateResumeFile, setCandidateResumeFile] = useState<File | null>(null);
  const [resumeDragActive, setResumeDragActive] = useState(false);
  const candidatePhotoInputRef = useRef<HTMLInputElement | null>(null);
  const candidateResumeInputRef = useRef<HTMLInputElement | null>(null);

  const requestedRole = searchParams.get("role") === "company" ? "company" : "fresher";
  const isCompanyFlow = requestedRole === "company";
  const content = roleContent[requestedRole];

  function roleHref(nextRole: "fresher" | "company") {
    return nextRole === "company" ? "/register?role=company" : "/register";
  }

  useEffect(() => {
    if (user) {
      router.replace(dashboardPath(user.role));
    }
  }, [router, user]);

  useEffect(() => {
    setForm((current) => {
      if (current.role === requestedRole) {
        return current;
      }
      return { ...current, role: requestedRole };
    });
  }, [requestedRole]);

  useEffect(() => {
    if (!candidatePhotoFile) {
      setCandidatePhotoPreview("");
      return;
    }

    const nextPreview = URL.createObjectURL(candidatePhotoFile);
    setCandidatePhotoPreview(nextPreview);
    return () => {
      URL.revokeObjectURL(nextPreview);
    };
  }, [candidatePhotoFile]);

  function clearCandidatePhoto() {
    setCandidatePhotoFile(null);
    setPhotoDragActive(false);
    if (candidatePhotoInputRef.current) {
      candidatePhotoInputRef.current.value = "";
    }
  }

  function acceptCandidatePhoto(file: File | null) {
    if (!file) {
      clearCandidatePhoto();
      return false;
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!PHOTO_EXTENSIONS.has(extension)) {
      setTone("error");
      setMessage("Please upload your photo as a PNG, JPG, JPEG, WEBP, or GIF file.");
      return false;
    }

    if (file.size > PHOTO_MAX_SIZE) {
      setTone("error");
      setMessage("Please keep your photo file under 5 MB.");
      return false;
    }

    setCandidatePhotoFile(file);
    setPhotoDragActive(false);
    return true;
  }

  function handleCandidatePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    void acceptCandidatePhoto(event.target.files?.[0] || null);
  }

  function handleCandidatePhotoDrag(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setPhotoDragActive(true);
    } else {
      setPhotoDragActive(false);
    }
  }

  function handleCandidatePhotoDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    setPhotoDragActive(false);
    void acceptCandidatePhoto(event.dataTransfer.files?.[0] || null);
  }

  function clearCandidateResume() {
    setCandidateResumeFile(null);
    setResumeDragActive(false);
    if (candidateResumeInputRef.current) {
      candidateResumeInputRef.current.value = "";
    }
  }

  function acceptCandidateResume(file: File | null) {
    if (!file) {
      clearCandidateResume();
      return false;
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!RESUME_EXTENSIONS.has(extension)) {
      setTone("error");
      setMessage("Please upload your resume as a PDF, DOC, or DOCX file.");
      return false;
    }

    if (file.size > RESUME_MAX_SIZE) {
      setTone("error");
      setMessage("Please keep your resume file under 10 MB.");
      return false;
    }

    setCandidateResumeFile(file);
    setResumeDragActive(false);
    return true;
  }

  function handleCandidateResumeChange(event: ChangeEvent<HTMLInputElement>) {
    void acceptCandidateResume(event.target.files?.[0] || null);
  }

  function handleCandidateResumeDrag(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setResumeDragActive(true);
    } else {
      setResumeDragActive(false);
    }
  }

  function handleCandidateResumeDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    setResumeDragActive(false);
    void acceptCandidateResume(event.dataTransfer.files?.[0] || null);
  }

  function formatUploadList(items: string[]) {
    if (items.length <= 1) {
      return items[0] || "";
    }
    if (items.length === 2) {
      return `${items[0]} and ${items[1]}`;
    }
    return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const payload =
      form.role === "company"
        ? {
            role: "company",
            name: form.name,
            email: form.email,
            password: form.password,
            company_name: form.company_name,
            company_website: form.company_website,
            location: form.location,
            company_description: form.company_description,
            industry_type: form.industry_type,
            company_size: form.company_size
          }
        : {
            role: "fresher",
            name: form.name,
            email: form.email,
            password: form.password,
            education: form.education,
            grad_year: Number(form.grad_year),
            skills: form.skills,
            location: form.location,
            summary: form.summary
          };

    try {
      const response = await apiRequest<RegisterResponse>("/api/auth/register", {
        method: "POST",
        body: payload
      });
      if (response.access_token) {
        let currentUser = response.user;
        const uploadSuccesses: string[] = [];
        const uploadFailures: string[] = [];

        writeAccessToken(response.access_token);
        if (form.role === "fresher" && candidatePhotoFile) {
          try {
            const photoPayload = new FormData();
            photoPayload.append("photo", candidatePhotoFile);
            const photoResponse = await apiRequest<ProfilePhotoUploadResponse>("/api/user/photo", {
              method: "POST",
              body: photoPayload
            });
            currentUser = photoResponse.user;
            uploadSuccesses.push("profile photo");
          } catch (_photoError) {
            uploadFailures.push("profile photo");
          }
        }

        if (form.role === "fresher" && candidateResumeFile) {
          try {
            const resumePayload = new FormData();
            resumePayload.append("resume", candidateResumeFile);
            const resumeResponse = await apiRequest<ResumeUploadResponse>("/api/user/resume", {
              method: "POST",
              body: resumePayload
            });
            currentUser = resumeResponse.user;
            uploadSuccesses.push("resume");
          } catch (_resumeError) {
            uploadFailures.push("resume");
          }
        }

        let successMessage = "Welcome aboard! Your profile is ready and we're taking you to your workspace.";
        if (uploadSuccesses.length && !uploadFailures.length) {
          successMessage = `Welcome aboard! Your ${formatUploadList(uploadSuccesses)} ${uploadSuccesses.length === 1 ? "is" : "are"} ready, and your workspace is next.`;
        } else if (uploadFailures.length && !uploadSuccesses.length) {
          successMessage = `Your account is live, but ${formatUploadList(uploadFailures)} could not be uploaded. You can add ${uploadFailures.length === 1 ? "it" : "them"} later.`;
        } else if (uploadSuccesses.length && uploadFailures.length) {
          successMessage = `Your account is live with ${formatUploadList(uploadSuccesses)}, but ${formatUploadList(uploadFailures)} still need${uploadFailures.length === 1 ? "s" : ""} your attention later.`;
        }

        setUser(currentUser);
        setTone("success");
        setMessage(successMessage);
        router.push(dashboardPath(currentUser.role));
      } else {
        writeAccessToken("");
        setUser(null);
        setTone("success");
        setMessage(response.message || "Your employer account has been created and submitted for verification.");
        setForm((current) => ({ ...defaultForm, role: current.role }));
      }
    } catch (error) {
      setTone("error");
      setMessage(resolveRegisterErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      brandSubtitle="Professional onboarding for every role"
      showBrand={false}
      showUtilityHeader={true}
      signInHref={content.loginHref}
      createAccountHref={roleHref(requestedRole)}
      pageClassName={isCompanyFlow ? "company-register-page" : undefined}
      shellClassName={isCompanyFlow ? "enterprise-auth-shell" : undefined}
      leftClassName={isCompanyFlow ? "enterprise-auth-copy" : undefined}
      rightClassName={isCompanyFlow ? "enterprise-auth-card" : undefined}
      left={
        <>
          <div className="page-intro auth-copy-block">
            {isCompanyFlow ? (
              <div className="company-register-strip">
                <span className="section-label">{content.label}</span>
              </div>
            ) : (
              <span className="section-label">{content.label}</span>
            )}
            <h1 className="page-title">{content.title}</h1>
            <p className="muted">{content.description}</p>
          </div>

          <div className="auth-feature-grid">
            <article className="auth-feature-card">
              <span className="preview-kicker">Professional First Impression</span>
              <h3>Stand out from the very first review</h3>
              <p>Present your strengths clearly so recruiters can understand your fit without digging for context.</p>
            </article>
            <article className="auth-feature-card">
              <span className="preview-kicker">Faster Hiring Momentum</span>
              <h3>Move from sign-up to real opportunities quickly</h3>
              <p>Once your account is active, the platform keeps opportunity discovery, applications, and updates connected.</p>
            </article>
          </div>

          {!isCompanyFlow ? (
            <section className="card auth-note-card">
              <span className="section-label">Why Professionals Choose Fresher Connect</span>
              <div className="detail-list">
                <div className="detail-item">
                  <span>{content.noteTitle}</span>
                  <strong>{content.noteBody}</strong>
                </div>
                <div className="detail-item">
                  <span>Candidate outcomes</span>
                  <strong>Profiles, resumes, and summaries are organized to help recruiters evaluate you faster.</strong>
                </div>
                <div className="detail-item">
                  <span>Employer trust</span>
                  <strong>Employer accounts are verified before access, helping candidates engage with more confidence.</strong>
                </div>
              </div>
            </section>
          ) : null}
        </>
      }
      right={
        <>
          <div className={isCompanyFlow ? "company-form-head" : ""}>
            <span className="section-label">Create Your Account</span>
            <div className="role-switch auth-role-switch" aria-label="Select registration role" role="tablist">
              <button
                type="button"
                className={form.role === "fresher" ? "active" : ""}
                onClick={() => {
                  setForm((current) => ({ ...current, role: "fresher" }));
                  router.replace(roleHref("fresher"));
                }}
              >
                Candidate
              </button>
              <button
                type="button"
                className={form.role === "company" ? "active" : ""}
                onClick={() => {
                  setForm((current) => ({ ...current, role: "company" }));
                  router.replace(roleHref("company"));
                }}
              >
                Company
              </button>
            </div>
          </div>
          <div className="auth-role-note">
            <strong>{content.noteTitle}</strong>
            <span>{content.noteBody}</span>
          </div>

          <Feedback message={message} tone={tone} />
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="form-grid two-col">
                <label className="field">
                  <span>Your Full Name</span>
                  <input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder={form.role === "company" ? "Primary recruiter or hiring contact" : "Your full name"}
                    required
                  />
                </label>
                <label className="field">
                  <span>Professional Email Address</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="you@example.com"
                    required
                  />
                </label>
              </div>

              <div className="form-grid two-col">
                <label className="field">
                  <span>Create a Secure Password</span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Use at least 8 characters"
                    minLength={8}
                    required
                  />
                </label>
                <label className="field">
                  <span>City, State, or Preferred Work Region</span>
                  <input
                    value={form.location}
                    onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                    placeholder="Bengaluru, Pune, Remote"
                  />
                </label>
              </div>

            {form.role === "company" ? (
              <>
                <div className="form-grid two-col">
                  <label className="field">
                    <span>Registered Company Name</span>
                    <input
                      value={form.company_name}
                      onChange={(event) => setForm((current) => ({ ...current, company_name: event.target.value }))}
                      placeholder="Your company name"
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Company Website</span>
                    <input
                      value={form.company_website}
                      onChange={(event) => setForm((current) => ({ ...current, company_website: event.target.value }))}
                      placeholder="https://yourcompany.com"
                    />
                  </label>
                </div>

                <div className="form-grid two-col">
                  <label className="field">
                    <span>Industry Focus</span>
                    <input
                      value={form.industry_type}
                      onChange={(event) => setForm((current) => ({ ...current, industry_type: event.target.value }))}
                      placeholder="Technology, Finance, Operations..."
                    />
                  </label>
                  <label className="field">
                    <span>Team Size</span>
                    <input
                      value={form.company_size}
                      onChange={(event) => setForm((current) => ({ ...current, company_size: event.target.value }))}
                      placeholder="1-10, 11-50, 51-200..."
                    />
                  </label>
                </div>

                <label className="field">
                  <span>Company Overview</span>
                  <textarea
                    value={form.company_description}
                    onChange={(event) => setForm((current) => ({ ...current, company_description: event.target.value }))}
                    placeholder="Describe your company, hiring goals, and the kind of talent you want to attract."
                  />
                </label>
              </>
            ) : (
              <>
                <div className="field full-span">
                  <span>Professional Photo</span>
                  <input
                    ref={candidatePhotoInputRef}
                    id="candidatePhotoFile"
                    className="hidden-file-input"
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.gif,image/*"
                    onChange={handleCandidatePhotoChange}
                  />
                  <label
                    className={`file-dropzone candidate-photo-dropzone ${photoDragActive ? "is-dragover" : ""}`}
                    htmlFor="candidatePhotoFile"
                    onDragEnter={handleCandidatePhotoDrag}
                    onDragOver={handleCandidatePhotoDrag}
                    onDragLeave={handleCandidatePhotoDrag}
                    onDrop={handleCandidatePhotoDrop}
                  >
                    {candidatePhotoPreview ? (
                      <span className="candidate-photo-dropzone-body">
                        <span className="candidate-photo-preview">
                          <img src={candidatePhotoPreview} alt="Candidate photo preview" />
                        </span>
                        <span className="candidate-photo-copy">
                          <strong>{candidatePhotoFile?.name || "Professional photo selected"}</strong>
                          <span className="file-dropzone-note">Drag a new image here or click to replace your current photo.</span>
                          <span className="file-dropzone-meta has-file">PNG, JPG, WEBP, or GIF up to 5 MB.</span>
                        </span>
                      </span>
                    ) : (
                      <>
                        <strong>Drag and drop your professional photo here</strong>
                        <span className="file-dropzone-note">or click to upload a PNG, JPG, WEBP, or GIF image</span>
                        <span className="file-dropzone-meta">A clear headshot works best. Maximum file size: 5 MB.</span>
                      </>
                    )}
                  </label>
                  {candidatePhotoFile ? (
                    <div className="candidate-upload-actions">
                      <span className="file-dropzone-meta has-file">Ready to upload: {candidatePhotoFile.name}</span>
                      <button className="btn secondary compact-btn" type="button" onClick={clearCandidatePhoto}>
                        Remove Photo
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="field full-span">
                  <span>Resume</span>
                  <input
                    ref={candidateResumeInputRef}
                    id="candidateResumeFile"
                    className="hidden-file-input"
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleCandidateResumeChange}
                  />
                  <label
                    className={`file-dropzone candidate-resume-dropzone ${resumeDragActive ? "is-dragover" : ""}`}
                    htmlFor="candidateResumeFile"
                    onDragEnter={handleCandidateResumeDrag}
                    onDragOver={handleCandidateResumeDrag}
                    onDragLeave={handleCandidateResumeDrag}
                    onDrop={handleCandidateResumeDrop}
                  >
                    <strong>{candidateResumeFile?.name || "Drag and drop your resume here"}</strong>
                    <span className="file-dropzone-note">
                      {candidateResumeFile
                        ? "Drag a new resume here or click to replace your current file."
                        : "or click to upload a PDF, DOC, or DOCX resume"}
                    </span>
                    <span className={`file-dropzone-meta ${candidateResumeFile ? "has-file" : ""}`}>
                      {candidateResumeFile ? "Your resume is ready to upload as soon as the account is created." : "Resume parsing begins automatically after sign-up. Maximum file size: 10 MB."}
                    </span>
                  </label>
                  {candidateResumeFile ? (
                    <div className="candidate-upload-actions">
                      <span className="file-dropzone-meta has-file">Ready to upload: {candidateResumeFile.name}</span>
                      <button className="btn secondary compact-btn" type="button" onClick={clearCandidateResume}>
                        Remove Resume
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="form-grid two-col">
                  <label className="field">
                    <span>Highest Qualification</span>
                    <input
                      value={form.education}
                      onChange={(event) => setForm((current) => ({ ...current, education: event.target.value }))}
                      placeholder="B.Tech, BCA, MCA, MBA..."
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Graduation year</span>
                    <input
                      type="number"
                      value={form.grad_year}
                      onChange={(event) => setForm((current) => ({ ...current, grad_year: event.target.value }))}
                      placeholder="2026"
                      required
                    />
                  </label>
                </div>

                <label className="field">
                  <span>Key Skills</span>
                  <input
                    value={form.skills}
                    onChange={(event) => setForm((current) => ({ ...current, skills: event.target.value }))}
                    placeholder="React, SQL, communication, problem solving"
                  />
                </label>

                <label className="field">
                  <span>Professional Summary</span>
                  <textarea
                    value={form.summary}
                    onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
                    placeholder="Write a concise introduction recruiters can understand quickly."
                  />
                </label>
              </>
            )}

            <button className="btn primary" type="submit" disabled={submitting}>
              {submitting ? "Creating your account..." : form.role === "company" ? "Create Employer Account" : "Launch Your Career Today"}
            </button>
          </form>

          <div className="auth-inline-meta">
            <span>Already have access?</span>
            <Link href={content.loginHref} className="text-link">
              {content.loginText}
            </Link>
          </div>
        </>
      }
    />
  );
}
