// Use your live key for production
const stripe = Stripe(
  "pk_live_51QgJ1jB9nS1ga46ZQ1V0cKQgHALtlLnRkNcNkRQgPYZm0HqkwWZvih3taVzL6Vr1Ewh3PxC48nEo7GMgz4PDA93Z00Gcy8tYWD"
);

// Global variables to manage the checkout instance and coupon code
let checkout = null;
let currentCouponCode = "";

// Get references to the new coupon elements from the HTML
const couponInput = document.getElementById("coupon-code");
const applyCouponBtn = document.getElementById("apply-coupon-btn");
const couponMessage = document.getElementById("coupon-message");

// Initialize checkout when the page first loads
initialize();

// Add an event listener to the "Apply" button
applyCouponBtn.addEventListener("click", () => {
  const code = couponInput.value.trim();
  if (code) {
    currentCouponCode = code;
    couponMessage.textContent = "Applying coupon...";
    
    // Unmount the current checkout form if it exists
    if (checkout) {
      checkout.unmount();
    }
    
    // Re-initialize the checkout to apply the coupon code
    initialize();
  } else {
    couponMessage.textContent = "Please enter a valid coupon code.";
  }
});

async function initialize() {
  try {
    const loadingElement = document.getElementById("loading");
    const checkoutElement = document.getElementById("checkout");
    const errorElement = document.getElementById("error-text");
    const errorSection = document.getElementById("error-message");

    // Show loading state and hide previous content/errors
    loadingElement.classList.remove("hidden");
    checkoutElement.classList.add("hidden"); 
    errorSection.classList.add("hidden");

    const urlParams = new URLSearchParams(window.location.search);
    const rB = urlParams.get("rB");

    // console.log("Initializing checkout with rB:", rB, "and Coupon:", currentCouponCode);

    const fetchClientSecret = async () => {
      const response = await fetch(
        "https://api-i140.flyai.online/api-i140/create-checkout-session",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Send both the rB parameter and the coupon code to your backend
          body: JSON.stringify({ rB: rB, coupon: currentCouponCode }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP error! Status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const { clientSecret, error } = await response.json();
      if (error) {
        throw new Error(error);
      }
      return clientSecret;
    };

    // Initialize Stripe's embedded checkout
    checkout = await stripe.initEmbeddedCheckout({
      fetchClientSecret,
    });

    // Mount the new checkout form
    checkout.mount("#checkout");

    // Hide loading and show the form
    loadingElement.classList.add("hidden");
    checkoutElement.classList.remove("hidden");
    
    if (currentCouponCode) {
      couponMessage.textContent = "Coupon applied successfully! The price has been updated.";
    }

  } catch (error) {
    console.error("Checkout initialization error:", error);
    couponMessage.textContent = ""; // Clear coupon message on error
    if (errorElement && errorSection) {
      errorElement.textContent = `Error: ${error.message}. If you used a coupon, it might be invalid. Please remove it or try again.`;
      errorSection.classList.remove("hidden");
      if (loadingElement) loadingElement.classList.add("hidden");
    } else {
      alert(`Error: ${error.message}`);
    }
  }
}



// // Load Stripe publishable key from environment or configuration (replace with your live key in production)
// // const stripe = Stripe(
// //   "pk_test_51QgJ1jB9nS1ga46ZkcuAUJyCmkrKRPwDND5zxABDiTexAY6KHsDQyf8tKn4zM9zoX3ZKUEROa4UAOzwuB2bykYQM00t6fUuiJP"
// // );
// const stripe = Stripe(
//   "pk_live_51QgJ1jB9nS1ga46ZQ1V0cKQgHALtlLnRkNcNkRQgPYZm0HqkwWZvih3taVzL6Vr1Ewh3PxC48nEo7GMgz4PDA93Z00Gcy8tYWD"
// );
// //live key for production - pk_live_51QgJ1jB9nS1ga46ZQ1V0cKQgHALtlLnRkNcNkRQgPYZm0HqkwWZvih3taVzL6Vr1Ewh3PxC48nEo7GMgz4PDA93Z00Gcy8tYWD

// initialize();

// async function initialize() {
//   try {
//     const loadingElement = document.getElementById("loading");
//     const errorElement = document.getElementById("error-text");
//     const errorSection = document.getElementById("error-message");

//     const urlParams = new URLSearchParams(window.location.search);
//     const rB = urlParams.get("rB");

//     console.log("rB value:", rB);

//     const fetchClientSecret = async () => {
//       const response = await fetch(
//         "https://api-i140.flyai.online/api-i140/create-checkout-session",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ rB }),
//         }
//       );

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const { clientSecret, error } = await response.json();
//       if (error) {
//         throw new Error(error);
//       }
//       return clientSecret;
//     };

//     const checkout = await stripe.initEmbeddedCheckout({
//       fetchClientSecret,
//     });

//     // Mount Checkout
//     checkout.mount("#checkout");

//     // Hide loading state
//     if (loadingElement) loadingElement.classList.add("hidden");
//   } catch (error) {
//     console.error("Checkout initialization error:", error);
//     if (errorElement && errorSection) {
//       errorElement.textContent = `Unable to load payment form: ${error.message}. Please try again or contact support@immigenius.us.`;
//       errorSection.classList.remove("hidden");
//       if (loadingElement) loadingElement.classList.add("hidden");
//     } else {
//       alert(`Error: ${error.message}`);
//     }
//   }
// }
