// This is already integrated in the user.js file
// Additional map utilities can be added here if needed

function initMap() {
  // This function is called by the Google Maps API script
  // The actual map initialization is handled in the EVUser class
  if (document.getElementById('user-dashboard')) {
    new EVUser();
  }
}

// Export the initMap function for Google Maps API callback
window.initMap = initMap;