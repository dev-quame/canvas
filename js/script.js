(function () {
  "use strict";

  const form = document.getElementById("contactForm");
  const status = document.getElementById("status");
  const submitBtn = document.getElementById("submitBtn");

  if (!form || !status || !submitBtn) {
    return;
  }

  const defaultEndpoint = "https://canvas-api-52de.onrender.com/api/forms";
  const endpoint = (form.dataset.endpoint || defaultEndpoint).trim() || defaultEndpoint;
  const healthEndpoint = endpoint.replace(/\/api\/forms\/?$/i, "/api/health");
  const submitLabel = "Send Message ->";
  const loadingLabel = "Sending...";
  const timeoutMs = 30000;

  const fields = {
    name: document.getElementById("name"),
    email: document.getElementById("email"),
    subject: document.getElementById("subject"),
    message: document.getElementById("message"),
  };

  let isSubmitting = false;
  let warmupStarted = false;

  function cleanText(value) {
    return value.replace(/[\u0000-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim();
  }

  function setStatus(type, message) {
    status.textContent = message;
    status.className = type;
  }

  function buildPayload() {
    return {
      name: cleanText(fields.name?.value || ""),
      email: cleanText(fields.email?.value || "").toLowerCase(),
      subject: cleanText(fields.subject?.value || ""),
      message: cleanText(fields.message?.value || ""),
    };
  }

  function isPayloadReady() {
    if (!form.checkValidity()) {
      return false;
    }

    const payload = buildPayload();
    return validatePayload(payload) === "";
  }

  function updateButtonState() {
    submitBtn.disabled = isSubmitting || !isPayloadReady();
    submitBtn.setAttribute("aria-disabled", String(submitBtn.disabled));
  }

  function validatePayload(payload) {
    if (payload.name.length < 2 || payload.name.length > 80) {
      return "Please enter a valid name (2-80 characters).";
    }

    if (payload.subject.length < 3 || payload.subject.length > 120) {
      return "Please enter a valid subject (3-120 characters).";
    }

    if (payload.message.length < 20 || payload.message.length > 1500) {
      return "Please write a message between 20 and 1500 characters.";
    }

    return "";
  }

  async function parseResponse(response) {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return {};
    }

    try {
      return await response.json();
    } catch (error) {
      return {};
    }
  }

  function warmUpServer() {
    if (warmupStarted) {
      return;
    }

    warmupStarted = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 7000);

    fetch(healthEndpoint, {
      method: "GET",
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
      referrerPolicy: "strict-origin-when-cross-origin",
      signal: controller.signal,
    })
      .catch(() => {})
      .finally(() => {
        window.clearTimeout(timeoutId);
      });
  }

  window.addEventListener("load", warmUpServer, { once: true });
  form.addEventListener("focusin", warmUpServer, { once: true });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!form.reportValidity()) {
      setStatus("error", "Please complete all required fields correctly.");
      return;
    }

    const botField = form.querySelector('input[name="bot-field"]');
    if (botField && botField.value.trim() !== "") {
      form.reset();
      setStatus("success", "Thanks. Message submitted.");
      updateButtonState();
      return;
    }

    warmUpServer();

    const payload = buildPayload();

    const validationError = validatePayload(payload);
    if (validationError) {
      setStatus("error", validationError);
      return;
    }

    isSubmitting = true;
    submitBtn.textContent = loadingLabel;
    setStatus("loading", "Sending your message...");
    updateButtonState();

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        referrerPolicy: "strict-origin-when-cross-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const result = await parseResponse(response);
      if (!response.ok) {
        const fallbackMessage =
          response.status === 429
            ? "Too many requests right now. Please try again in a moment."
            : response.status === 403
              ? "Sorry, your message could not be sent right now. Please try again later or email me directly."
              : response.status >= 500
                ? "Server is unavailable right now. If this is Render free tier sleep, wait a moment and try again."
            : "Unable to send your message right now. Please try again.";
        throw new Error(result.error || fallbackMessage);
      }

      form.reset();
      setStatus("success", "Thanks, your message was sent successfully.");
      window.setTimeout(() => {
        status.textContent = "";
        status.className = "";
      }, 5000);
    } catch (error) {
      if (error.name === "AbortError") {
        setStatus("error", "Request timed out. Server may be waking from sleep. Please wait 20-30 seconds and try again.");
      } else if (error instanceof TypeError) {
        setStatus("error", "Sorry, your message could not be sent right now. Please check your connection or email me directly.");
      } else {
        setStatus("error", error.message || "Network error. Please try again.");
      }
    } finally {
      window.clearTimeout(timeoutId);
      isSubmitting = false;
      submitBtn.textContent = submitLabel;
      updateButtonState();
    }
  });

  form.addEventListener("input", () => {
    if (status.className === "error") {
      status.textContent = "";
      status.className = "";
    }
    updateButtonState();
  });

  updateButtonState();
})();
