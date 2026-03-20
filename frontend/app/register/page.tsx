"use client";

import { ChangeEvent, DragEvent, FormEvent, Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthShell } from "@/components/auth-shell";
import { Feedback } from "@/components/feedback";
import { apiRequest, writeAccessToken } from "@/lib/api";
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
    title: "Create a candidate account and start a structured hiring journey.",
    description: "Build your profile, add your education and skills, then move from role discovery to application tracking.",
    noteTitle: "Candidate onboarding",
    noteBody: "Candidate accounts can sign in immediately after registration and continue from the opportunity directory.",
    loginHref: "/login",
    loginText: "Sign in as candidate"
  },
  company: {
    label: "Company Registration",
    title: "Register your company and prepare a verified recruiter workspace.",
    description: "Share employer details, hiring context, and company information so the admin team can verify your account.",
    noteTitle: "Employer onboarding",
    noteBody: "Company accounts are created first, then activated for recruiter access after admin verification.",
    loginHref: "/login?role=company",
    loginText: "Sign in as recruiter"
  }
} as const;

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-shell">
          <section className="auth-card auth-card-strong">
            <div className="empty-state">Loading registration experience...</div>
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
      setMessage("Upload a PNG, JPG, JPEG, WEBP, or GIF image for the candidate photo.");
      return false;
    }

    if (file.size > PHOTO_MAX_SIZE) {
      setTone("error");
      setMessage("Candidate photo must be 5 MB or smaller.");
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
      setMessage("Upload the candidate resume as a PDF, DOC, or DOCX file.");
      return false;
    }

    if (file.size > RESUME_MAX_SIZE) {
      setTone("error");
      setMessage("Candidate resume must be 10 MB or smaller.");
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

        let successMessage = "Account created. Redirecting to your workspace.";
        if (uploadSuccesses.length && !uploadFailures.length) {
          successMessage = `Account created with ${formatUploadList(uploadSuccesses)}. Redirecting to your workspace.`;
        } else if (uploadFailures.length && !uploadSuccesses.length) {
          successMessage = `Account created, but ${formatUploadList(uploadFailures)} could not be uploaded. You can add ${uploadFailures.length === 1 ? "it" : "them"} later.`;
        } else if (uploadSuccesses.length && uploadFailures.length) {
          successMessage = `Account created with ${formatUploadList(uploadSuccesses)}, but ${formatUploadList(uploadFailures)} could not be uploaded. You can add ${uploadFailures.length === 1 ? "it" : "them"} later.`;
        }

        setUser(currentUser);
        setTone("success");
        setMessage(successMessage);
        router.push(dashboardPath(currentUser.role));
      } else {
        writeAccessToken("");
        setUser(null);
        setTone("success");
        setMessage(response.message || "Company account created. Wait for admin verification before login.");
        setForm((current) => ({ ...defaultForm, role: current.role }));
      }
    } catch (_error) {
      setTone("error");
      setMessage("Registration failed. Check the required fields and backend connection.");
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
              <span className="preview-kicker">Scalable Frontend</span>
              <h3>Reusable forms and route-level structure</h3>
              <p>Role-specific onboarding now lives in one reusable frontend flow without duplicating page logic.</p>
            </article>
            <article className="auth-feature-card">
              <span className="preview-kicker">Backend Aligned</span>
              <h3>Payloads map directly to the existing APIs</h3>
              <p>Candidate and company registration keep the current backend flows intact while the UI stays modular and reusable.</p>
            </article>
          </div>

          {!isCompanyFlow ? (
            <section className="card auth-note-card">
              <span className="section-label">Why This Flow</span>
              <div className="detail-list">
                <div className="detail-item">
                  <span>{content.noteTitle}</span>
                  <strong>{content.noteBody}</strong>
                </div>
                <div className="detail-item">
                  <span>Candidate access</span>
                  <strong>Education, skills, and summary fields support immediate role discovery after signup.</strong>
                </div>
                <div className="detail-item">
                  <span>Employer access</span>
                  <strong>Company accounts are created first and activated after admin verification.</strong>
                </div>
              </div>
            </section>
          ) : null}
        </>
      }
      right={
        <>
          <div className={isCompanyFlow ? "company-form-head" : ""}>
            <span className="section-label">Account Setup</span>
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
                <span>Name</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder={form.role === "company" ? "Recruiter or contact name" : "Candidate name"}
                  required
                />
              </label>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="name@example.com"
                  required
                />
              </label>
            </div>

            <div className="form-grid two-col">
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  required
                />
              </label>
              <label className="field">
                <span>Location</span>
                <input
                  value={form.location}
                  onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                  placeholder="City, state, or remote preference"
                />
              </label>
            </div>

            {form.role === "company" ? (
              <>
                <div className="form-grid two-col">
                  <label className="field">
                    <span>Company name</span>
                    <input
                      value={form.company_name}
                      onChange={(event) => setForm((current) => ({ ...current, company_name: event.target.value }))}
                      placeholder="Company name"
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Website</span>
                    <input
                      value={form.company_website}
                      onChange={(event) => setForm((current) => ({ ...current, company_website: event.target.value }))}
                      placeholder="https://company.com"
                    />
                  </label>
                </div>

                <div className="form-grid two-col">
                  <label className="field">
                    <span>Industry</span>
                    <input
                      value={form.industry_type}
                      onChange={(event) => setForm((current) => ({ ...current, industry_type: event.target.value }))}
                      placeholder="IT, SaaS, EdTech..."
                    />
                  </label>
                  <label className="field">
                    <span>Company size</span>
                    <input
                      value={form.company_size}
                      onChange={(event) => setForm((current) => ({ ...current, company_size: event.target.value }))}
                      placeholder="1-10, 11-50..."
                    />
                  </label>
                </div>

                <label className="field">
                  <span>Description</span>
                  <textarea
                    value={form.company_description}
                    onChange={(event) => setForm((current) => ({ ...current, company_description: event.target.value }))}
                    placeholder="Describe the company and hiring context."
                  />
                </label>
              </>
            ) : (
              <>
                <div className="field full-span">
                  <span>Candidate photo</span>
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
                          <strong>{candidatePhotoFile?.name || "Candidate photo selected"}</strong>
                          <span className="file-dropzone-note">Drag a new image here or click to replace the current photo.</span>
                          <span className="file-dropzone-meta has-file">PNG, JPG, WEBP, or GIF up to 5 MB.</span>
                        </span>
                      </span>
                    ) : (
                      <>
                        <strong>Drag and drop your profile photo here</strong>
                        <span className="file-dropzone-note">or click to upload a PNG, JPG, WEBP, or GIF file</span>
                        <span className="file-dropzone-meta">Square headshots work best. Max file size: 5 MB.</span>
                      </>
                    )}
                  </label>
                  {candidatePhotoFile ? (
                    <div className="candidate-upload-actions">
                      <span className="file-dropzone-meta has-file">Selected: {candidatePhotoFile.name}</span>
                      <button className="btn secondary compact-btn" type="button" onClick={clearCandidatePhoto}>
                        Remove photo
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
                        ? "Drag a new resume here or click to replace the current file."
                        : "or click to upload a PDF, DOC, or DOCX resume file"}
                    </span>
                    <span className={`file-dropzone-meta ${candidateResumeFile ? "has-file" : ""}`}>
                      {candidateResumeFile ? "Resume selected for upload during account creation." : "Resume parsing will start automatically after signup. Max file size: 10 MB."}
                    </span>
                  </label>
                  {candidateResumeFile ? (
                    <div className="candidate-upload-actions">
                      <span className="file-dropzone-meta has-file">Selected: {candidateResumeFile.name}</span>
                      <button className="btn secondary compact-btn" type="button" onClick={clearCandidateResume}>
                        Remove resume
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="form-grid two-col">
                  <label className="field">
                    <span>Education</span>
                    <input
                      value={form.education}
                      onChange={(event) => setForm((current) => ({ ...current, education: event.target.value }))}
                      placeholder="B.Tech, BCA, MCA..."
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
                  <span>Skills</span>
                  <input
                    value={form.skills}
                    onChange={(event) => setForm((current) => ({ ...current, skills: event.target.value }))}
                    placeholder="JavaScript, SQL, React"
                  />
                </label>

                <label className="field">
                  <span>Summary</span>
                  <textarea
                    value={form.summary}
                    onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
                    placeholder="Short introduction for your candidate profile."
                  />
                </label>
              </>
            )}

            <button className="btn primary" type="submit" disabled={submitting}>
              {submitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="auth-inline-meta">
            <span>Already registered?</span>
            <Link href={content.loginHref} className="text-link">
              {content.loginText}
            </Link>
          </div>
        </>
      }
    />
  );
}
