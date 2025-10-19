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

// Save PDF
document.addEventListener("DOMContentLoaded", () => {
  const pdfButton = document
    .querySelector(".bi-file-earmark-pdf")
    ?.closest("button");
  const iframe = document.getElementById("widgetFrame");

  pdfButton?.addEventListener("click", async () => {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

      // clone iframe content into hidden div
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = iframeDoc.documentElement.innerHTML;
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.background = "#fff";
      tempDiv.style.padding = "20px";
      tempDiv.style.width = iframe.clientWidth + "px";
      document.body.appendChild(tempDiv);

      await new Promise((r) => setTimeout(r, 300));

      // capture with html2canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 1.2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });

      document.body.removeChild(tempDiv);

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF("p", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 25;

      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let position = margin;
      let remainingHeight = imgHeight;
      let yOffset = 0;

      const imgData = canvas.toDataURL("image/jpeg", 0.65);

      // loop pages cleanly
      while (remainingHeight > 0) {
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.min(
          canvas.height - yOffset,
          (pageHeight - margin * 2) * (canvas.width / imgWidth)
        );

        const ctx = pageCanvas.getContext("2d");
        ctx.drawImage(
          canvas,
          0,
          yOffset,
          canvas.width,
          pageCanvas.height,
          0,
          0,
          canvas.width,
          pageCanvas.height
        );

        const pageData = pageCanvas.toDataURL("image/jpeg", 0.65);
        pdf.addImage(
          pageData,
          "JPEG",
          margin,
          margin,
          imgWidth,
          (pageCanvas.height * imgWidth) / canvas.width
        );

        yOffset += pageCanvas.height;
        remainingHeight -= (pageCanvas.height * imgWidth) / canvas.width;

        if (remainingHeight > 0) pdf.addPage();
      }

      // disclaimer page
      pdf.addPage();
      pdf.setFont("helvetica", "bolditalic");
      pdf.setFontSize(16);
      pdf.setTextColor(40, 40, 40);
      pdf.text("Disclaimer", margin, 100);

      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(12);
      pdf.setTextColor(80, 80, 80);
      const disclaimer = `
        This report has been generated automatically using AI reasoning 
        based on patterns and examples derived from National Interest 
        Waiver (NIW) case studies.

        It is intended for informational and educational purposes only 
        and should not be considered legal advice or a substitute for 
        professional immigration counsel.

        For specific legal concerns, consult a qualified immigration 
        attorney.
      `;
      pdf.text(disclaimer, margin, 130, { maxWidth: pageWidth - margin * 2 });

      pdf.save("Immigenius_Report.pdf");
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    }
  });
});
