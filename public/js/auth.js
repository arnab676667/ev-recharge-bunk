import { auth } from './firebase-config.js';

// DOM elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const logoutBtn = document.getElementById('logout-btn');

// Login function
const loginUser = (email, password) => {
  return auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      console.log('User logged in:', userCredential.user);
      return userCredential.user;
    })
    .catch((error) => {
      console.error('Login error:', error);
      throw error;
    });
};

// Register function
const registerUser = (email, password, userData) => {
  return auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      console.log('User registered:', userCredential.user);
      
      // Add additional user data to Firestore
      return db.collection('users').doc(userCredential.user.uid).set({
        ...userData,
        role: userData.role || 'user', // Default to 'user' role
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    })
    .catch((error) => {
      console.error('Registration error:', error);
      throw error;
    });
};

// Logout function
const logoutUser = () => {
  return auth.signOut()
    .then(() => {
      console.log('User logged out');
    })
    .catch((error) => {
      console.error('Logout error:', error);
    });
};

// Auth state listener
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('User state changed: logged in', user);
    // Update UI for logged in user
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('user-section').style.display = 'block';
    
    // Check user role and show appropriate dashboard
    db.collection('users').doc(user.uid).get()
      .then((doc) => {
        if (doc.exists) {
          const userData = doc.data();
          if (userData.role === 'admin') {
            showAdminDashboard();
          } else {
            showUserDashboard();
          }
        }
      });
  } else {
    console.log('User state changed: logged out');
    // Update UI for logged out user
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('user-section').style.display = 'none';
  }
});

// Event listeners
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = loginForm['login-email'].value;
    const password = loginForm['login-password'].value;
    
    loginUser(email, password)
      .then(() => {
        // Redirect or show success message
      })
      .catch((error) => {
        showError(error.message);
      });
  });
}

if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = registerForm['register-email'].value;
    const password = registerForm['register-password'].value;
    const name = registerForm['register-name'].value;
    const phone = registerForm['register-phone'].value;
    
    registerUser(email, password, { name, phone })
      .then(() => {
        // Redirect or show success message
      })
      .catch((error) => {
        showError(error.message);
      });
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', logoutUser);
}

// Utility function to show errors
function showError(message) {
  const errorElement = document.getElementById('auth-error');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  setTimeout(() => {
    errorElement.style.display = 'none';
  }, 5000);
}