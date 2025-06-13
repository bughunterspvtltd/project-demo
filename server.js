const users = require('./users.json');
const session = require('express-session');

process.on('uncaughtException', function (err) {
  console.error('Uncaught Exception:', err.stack);
});

const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(session({
  secret: 'your-super-secret-key', // Change this to something random!
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 2 * 60 * 60 * 1000 } // 2 hours
}));

const USERNAME = "admin";
const PASSWORD = "password123";

// Serve login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Handle login POST
app.use(express.urlencoded({ extended: true })); // Add this for POST form parsing


// Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    req.session.loggedIn = true;
    req.session.username = username;
    res.redirect('/index.html');
  } else {
    // On failed login, redirect back to login page with error flag
    res.redirect('/login?error=1');
  }
});





// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Middleware to protect pages
function requireLogin(req, res, next) {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect('/login');
  }
}

// Protect ALL static files except login
app.use((req, res, next) => {
  if (
    req.path === '/login' ||
    req.path === '/login.html' ||
    req.path.startsWith('/assets') ||
    req.path === '/favicon.ico'
  ) {
    return next();
  }
  requireLogin(req, res, next);
});






// Multer setup to save uploaded file as uploads/data.xlsx
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) => cb(null, 'data.xlsx')
});
const upload = multer({ storage: storage });

app.use(express.static('public'));

// API to fetch Excel data as JSON
app.get('/data', (req, res) => {
  const excelPath = path.join(__dirname, 'uploads', 'Book1.xlsx');
  if (!fs.existsSync(excelPath)) return res.json([]);
  try {
    const workbook = xlsx.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    // header: 1 means every row is an array, NOT keys
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {header: 1, defval: ""});
    // Remove all-empty rows
    const filteredRows = rows.filter(r => r[0] && r[1]);
    // The first row should be your first section!
    const sections = filteredRows.map(r => ({
      heading: r[0],
      content: r[1]
    }));
    res.json(sections);
  } catch (err) {
    res.status(500).json({ error: "Invalid Excel file" });
  }
});




// Upload endpoint
app.post('/upload', upload.single('excel'), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded.");
  res.redirect('/admin.html?uploaded=1');
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
