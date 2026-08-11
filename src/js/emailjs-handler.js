/* ──────────────────────────────────────────
   NovaPlay — EmailJS Integration
   ──────────────────────────────────────────
   Standalone EmailJS handler for the contact form.
   Handles validation, sending, loading states,
   and toast notifications.
   ────────────────────────────────────────── */

import emailjs from "@emailjs/browser";

/* ═════════════════════════════════════════════════════════
   🔑 EmailJS Configuration — Replace these placeholders
   ═════════════════════════════════════════════════════════ */

// ── Public Key: Found in EmailJS Dashboard → Account → API Keys
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";

// ── Service ID: Found in EmailJS Dashboard → Email Services
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";

// ── Template ID: Found in EmailJS Dashboard → Email Templates
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";

/* ═════════════════════════════════════════════════════════
   Helpers
   ═════════════════════════════════════════════════════════ */

function validateField(value, type = "text") {
  if (!value || value.trim() === "") return "This field is required.";
  if (type === "email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) return "Please enter a valid email address.";
  }
  return "";
}

/* ─── Toast System ─── */
function createToastContainer() {
  /* Reuse existing container if already created */
  let container = document.getElementById("toast-container");
  if (container) return container;

  container = document.createElement("div");
  container.id = "toast-container";
  container.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    gap: 12px;
    pointer-events: none;
    max-width: 400px;
    width: 100%;
  `;
  document.body.appendChild(container);
  return container;
}

function showToast(message, type = "success") {
  const container = createToastContainer();

  const isSuccess = type === "success";
  const bgColor = isSuccess
    ? "rgba(16, 185, 129, 0.12)"
    : "rgba(239, 68, 68, 0.12)";
  const borderColor = isSuccess
    ? "rgba(16, 185, 129, 0.25)"
    : "rgba(239, 68, 68, 0.25)";
  const textColor = isSuccess ? "#10b981" : "#ef4444";
  const iconSvg = isSuccess
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

  const toast = document.createElement("div");
  toast.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    border-radius: 14px;
    background: ${bgColor};
    border: 1px solid ${borderColor};
    color: ${textColor};
    font-family: "Outfit", sans-serif;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
    pointer-events: auto;
    transform: translateX(120%);
    opacity: 0;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                opacity 0.4s ease;
  `;
  toast.innerHTML = `
    <span style="flex-shrink: 0; display: flex; align-items: center;">${iconSvg}</span>
    <span style="flex: 1; color: #f1f5f9;">${message}</span>
  `;

  container.appendChild(toast);

  /* Trigger slide-in animation */
  requestAnimationFrame(() => {
    toast.style.transform = "translateX(0)";
    toast.style.opacity = "1";
  });

  /* Auto-remove after 5 seconds */
  const dismissTimeout = setTimeout(() => {
    dismissToast(toast);
  }, 5000);

  /* Dismiss on click */
  toast.addEventListener("click", () => {
    clearTimeout(dismissTimeout);
    dismissToast(toast);
  });
}

function dismissToast(toast) {
  toast.style.transform = "translateX(120%)";
  toast.style.opacity = "0";
  setTimeout(() => {
    toast.remove();
    /* Garbage-collect container if empty */
    const container = document.getElementById("toast-container");
    if (container && container.children.length === 0) {
      container.remove();
    }
  }, 400);
}

/* ─── Loading State ─── */
function setLoading(isLoading) {
  const btn = document.getElementById("submitBtn");
  const spinner = document.getElementById("submitSpinner");
  const icon = document.getElementById("submitIcon");
  const text = document.getElementById("submitText");

  if (!btn) return;

  if (isLoading) {
    btn.disabled = true;
    spinner?.classList.remove("hidden");
    icon?.classList.add("hidden");
    if (text) text.textContent = "Sending...";
  } else {
    btn.disabled = false;
    spinner?.classList.add("hidden");
    icon?.classList.remove("hidden");
    if (text) text.textContent = "Send Message";
  }
}

/* ═════════════════════════════════════════════════════════
   Initialization
   ═════════════════════════════════════════════════════════ */

export function initEmailJSForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  /* Initialize EmailJS SDK with your public key */
  emailjs.init(EMAILJS_PUBLIC_KEY);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    /* ─── Read form fields ─── */
    const name = document.getElementById("contactName")?.value.trim() || "";
    const email = document.getElementById("contactEmail")?.value.trim() || "";
    const subject = document.getElementById("contactSubject")?.value.trim() || "";
    const message = document.getElementById("contactMessage")?.value.trim() || "";

    /* ─── Validation ─── */
    const nameError = validateField(name);
    const emailError = validateField(email, "email");
    const subjectError = validateField(subject);
    const messageError = validateField(message);

    if (nameError || emailError || subjectError || messageError) {
      /* Focus the first invalid field */
      if (nameError) document.getElementById("contactName")?.focus();
      else if (emailError) document.getElementById("contactEmail")?.focus();
      else if (subjectError) document.getElementById("contactSubject")?.focus();
      else if (messageError) document.getElementById("contactMessage")?.focus();

      showToast("Please fill in all required fields correctly.", "error");
      return;
    }

    /* ─── Send via EmailJS ─── */
    setLoading(true);

    try {
      const templateParams = {
        from_name: name,
        from_email: email,
        subject: subject,
        message: message,
      };

      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);

      /* ─── Success ─── */
      setLoading(false);
      showToast("Your message has been sent successfully.", "success");
      form.reset();
    } catch (err) {
      /* ─── Error ─── */
      console.error("EmailJS error:", err);
      setLoading(false);
      showToast("Something went wrong. Please try again.", "error");
    }
  });
}

