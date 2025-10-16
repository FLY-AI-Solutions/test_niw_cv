async function initialize() {
  try {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const sessionId = urlParams.get("session_id");

    if (!sessionId) {
      console.error("No session_id found in URL");
      showError("Invalid session. Please try again.");
      return;
    }

    // Check session status
    const response = await fetch(
      `https://api-i140.flyai.online/api-i140/session-status?session_id=${sessionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const session = await response.json();

    if (session.error) {
      console.error("Session error:", session.error);
      showError("Failed to retrieve session status.");
      return;
    }

    if (session.status === "open") {
      window.location.replace(
        "https://fly-ai-solutions.github.io/test_niw_cv/checkout.html"
      );
    } else if (session.status === "complete") {
      const successElement = document.getElementById("success");
      const emailElement = document.getElementById("customer-email");

      if (!successElement || !emailElement) {
        console.error("Required DOM elements not found");
        showError("Page setup error. Please contact support.");
        return;
      }

      successElement.classList.remove("hidden");
      emailElement.textContent = session.customer_email || "Not provided";

      const urlParams = new URLSearchParams(window.location.search);
      const rB = urlParams.get("rB");
      if (!rB) {
        console.error("No rB found in URL");
        showError("Missing data reference (rB).");
        return;
      }

      const dataResponse = await fetch(
        "https://api-i140.flyai.online/api-i140/get-user-data",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rB: parseInt(rB) }),
        }
      );

      if (!dataResponse.ok)
        throw new Error(`Failed to fetch user data: ${dataResponse.status}`);

      const result = await dataResponse.json();

      if (result.status === "success" && result.json_data) {
        const summary = result.json_data;
        const output = document.getElementById("widgetFrame").contentWindow;
        output.postMessage({ type: "updateSummary", data: summary }, "*");
      } else {
        showError(result.message || "Failed to load data.");
      }
    } else {
      console.warn("Unexpected session status:", session.status);
      showError("Unexpected session status.");
    }
  } catch (error) {
    console.error("Error in initialize:", error);
    showError("An error occurred. Please try again later.");
  }
}

function showError(message) {
  const errorElement = document.getElementById("error-message");
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.remove("hidden");
  } else {
    alert(message);
  }
}

initialize();
