// --------- Firebase Setup ---------
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --------- Sign Up Function ---------
function signup() {
  const username = document.getElementById('signup-username').value.trim();
  const password = document.getElementById('signup-password').value;
  if (!username || !password) { alert('Enter username and password'); return; }

  const email = username + "@tradingjournal.com"; // Firebase needs email

  auth.createUserWithEmailAndPassword(email, password)
    .then(userCred => {
      const uid = userCred.user.uid;
      db.collection('journals').doc(uid).set({ username, entries: [] });
      alert('Signup successful! You can now login.');
      document.getElementById('signup-username').value = '';
      document.getElementById('signup-password').value = '';
    })
    .catch(err => alert(err.message));
}

// --------- Login Function ---------
function login() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const email = username + "@tradingjournal.com";

  auth.signInWithEmailAndPassword(email, password)
    .then(userCred => {
      const uid = userCred.user.uid;
      localStorage.setItem('currentUID', uid);
      document.getElementById('signup-login').style.display = 'none';
      document.getElementById('journal-app').style.display = 'block';
      loadJournal();
    })
    .catch(err => alert('Invalid credentials'));
}

// --------- Logout Function ---------
function logout() {
  auth.signOut().then(() => {
    localStorage.removeItem('currentUID');
    document.getElementById('signup-login').style.display = 'block';
    document.getElementById('journal-app').style.display = 'none';
  });
}

// --------- Add Journal Entry ---------
function addEntry() {
  const text = document.getElementById('journal-entry').value.trim();
  if (!text) return;
  const uid = localStorage.getItem('currentUID');

  db.collection('journals').doc(uid).update({
    entries: firebase.firestore.FieldValue.arrayUnion(text)
  }).then(() => {
    document.getElementById('journal-entry').value = '';
    loadJournal();
  });
}

// --------- Load Journal Entries ---------
function loadJournal() {
  const uid = localStorage.getItem('currentUID');
  db.collection('journals').doc(uid).get().then(doc => {
    const journalDiv = document.getElementById('entries');
    journalDiv.innerHTML = '';
    const entries = doc.data()?.entries || [];
    entries.forEach((entry, i) => {
      const div = document.createElement('div');
      div.className = 'entry';
      div.textContent = `${i+1}. ${entry}`;
      journalDiv.appendChild(div);
    });
  });
}
