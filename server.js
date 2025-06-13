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
