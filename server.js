const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Preserve original filename with timestamp to avoid conflicts
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept common document formats
    const allowedTypes = /pdf|doc|docx|txt|xlsx|xls|jpg|jpeg|png|gif/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, XLSX, XLS, JPG, JPEG, PNG, GIF are allowed.'));
    }
  }
});

// Route to upload document
app.post('/api/upload', upload.single('document'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
      success: true,
      message: 'File uploaded successfully',
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      path: `/uploads/${req.file.filename}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get list of uploaded documents
app.get('/api/documents', (req, res) => {
  try {
    fs.readdir(uploadsDir, (err, files) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to read documents' });
      }

      const documents = files.map(file => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          uploadedAt: stats.mtime
        };
      });

      res.json(documents);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Uploads directory: ${uploadsDir}`);
});
