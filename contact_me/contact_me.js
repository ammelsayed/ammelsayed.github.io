// Get the form element
var form = document.getElementById("contact-form");

// Function to handle form submission
async function handleSubmit(event) {
  event.preventDefault(); // Stop the default form submission (no redirect)

  // Get form data
  var data = new FormData(event.target);

  try {
    // Send the form data to Formspree using fetch
    const response = await fetch(event.target.action, {
      method: form.method,
      body: data,
      headers: {
        'Accept': 'application/json' // Expect JSON response
      }
    });

    if (response.ok) {
      // Success: Show a pop-up and reset the form
      alert("Thanks for your submission! Your message was sent successfully.");
      form.reset();
    } else {
      // Error: Parse the response for specific error details
      const errorData = await response.json();
      if (errorData.errors && errorData.errors.length > 0) {
        // Show specific error messages from Formspree
        const errorMessages = errorData.errors.map(error => error.message).join(", ");
        alert("Error: " + errorMessages);
      } else {
        // Generic error if no specific details are provided
        alert("Oops! There was a problem submitting your form.");
      }
    }
  } catch (error) {
    // Network or other unexpected errors
    alert("Oops! Something went wrong: " + error.message);
  }
}

// Attach the event listener to the form
form.addEventListener("submit", handleSubmit);