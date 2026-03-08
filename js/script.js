(function () {
  "use strict";

  const form = document.getElementById("contactForm");
  const status = document.getElementById("status");
  const submitBtn = document.getElementById("submitBtn");

  if (!form || !status || !submitBtn) {
    return;
  }

  const endpoint = "https://canvas-api-9y7i.onrender.com/api/forms";
  const submitLabel = "Send Message ->";
  const loadingLabel = "Sending...";
  const timeoutMs = 12000;

  const fields = {
    name: document.getElementById("name"),
    email: document.getElementById("email"),
    subject: document.getElementById("subject"),
    message: document.getElementById("message"),
  };

  let isSubmitting = false;

  function cleanText(value) {
    return value.replace(/[\u0000-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim();
  }

  function setStatus(type, message) {
    status.textContent = message;
    status.className = type;
  }

  function updateButtonState() {
    submitBtn.disabled = isSubmitting;
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

    const payload = {
      name: cleanText(fields.name?.value || ""),
      email: cleanText(fields.email?.value || "").toLowerCase(),
      subject: cleanText(fields.subject?.value || ""),
      message: cleanText(fields.message?.value || ""),
    };

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
        setStatus("error", "Request timed out. Please check your connection and try again.");
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
