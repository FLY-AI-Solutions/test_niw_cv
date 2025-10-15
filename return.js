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

    // Adjust endpoint to include root_path from FastAPI server
    const response = await fetch(
      `https://api-i140.flyai.online/api-i140/session-status?session_id=${sessionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const session = await response.json();

    if (session.error) {
      console.error("Session error:", session.error);
      showError("Failed to retrieve session status.");
      return;
    }

    if (session.status === "open") {
      // Update redirect URL to match your frontend domain
      window.location.replace(
        "https://fly-ai-solutions.github.io/test_niw_cv/checkout.html"
      ); // Replace with actual frontend URL
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
    } else {
      console.warn("Unexpected session status:", session.status);
      showError("Unexpected session status.");
    }
  } catch (error) {
    console.error("Error in initialize:", error);
    showError("An error occurred. Please try again later.");
  }
}

// Helper function to display errors (implement based on your UI)
function showError(message) {
  const errorElement = document.getElementById("error-message");
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.remove("hidden");
  } else {
    alert(message); // Fallback to alert if no error element exists
  }
}

// Initialize on page load
initialize();
