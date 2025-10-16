// Load Stripe publishable key from environment or configuration (replace with your live key in production)
const stripe = Stripe(
  "pk_test_51QgJ1sPUPs4f9DIg4OzitIWV4wYdSyspYyCyX0cDWylmCoV5qi0WdWPyRxwekw4aDGLK1vJM7xRjpZ7XktiVaZ7k00HqzzI2gD"
);
//live key for production - pk_live_51QgJ1jB9nS1ga46ZQ1V0cKQgHALtlLnRkNcNkRQgPYZm0HqkwWZvih3taVzL6Vr1Ewh3PxC48nEo7GMgz4PDA93Z00Gcy8tYWD

initialize();

async function initialize() {
  try {
    const loadingElement = document.getElementById("loading");
    const errorElement = document.getElementById("error-text");
    const errorSection = document.getElementById("error-message");

    const urlParams = new URLSearchParams(window.location.search);
    const rB = urlParams.get("rB");

    console.log("rB value:", rB);

    const fetchClientSecret = async () => {
      const response = await fetch(
        "https://api-i140.flyai.online/api-i140/create-checkout-session",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rB }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { clientSecret, error } = await response.json();
      if (error) {
        throw new Error(error);
      }
      return clientSecret;
    };

    const checkout = await stripe.initEmbeddedCheckout({
      fetchClientSecret,
    });

    // Mount Checkout
    checkout.mount("#checkout");

    // Hide loading state
    if (loadingElement) loadingElement.classList.add("hidden");
  } catch (error) {
    console.error("Checkout initialization error:", error);
    if (errorElement && errorSection) {
      errorElement.textContent = `Unable to load payment form: ${error.message}. Please try again or contact support@immigenius.us.`;
      errorSection.classList.remove("hidden");
      if (loadingElement) loadingElement.classList.add("hidden");
    } else {
      alert(`Error: ${error.message}`);
    }
  }
}
