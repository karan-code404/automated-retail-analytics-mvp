import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json());

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique name to prevent naming collisions
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to accept CSV only
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper function to run python analyzer with fallbacks ('python', 'python3', 'py')
const runPythonAnalyzer = (filePath, callback) => {
  const pythonCmds = ['python', 'python3', 'py'];
  const scriptPath = path.join(__dirname, 'analyzer.py');
  let cmdIndex = 0;

  function attemptSpawn() {
    const cmd = pythonCmds[cmdIndex];
    console.log(`Spawning Python process with command: ${cmd} ${scriptPath}`);
    const pyProcess = spawn(cmd, [scriptPath, filePath]);
    
    let stdoutData = '';
    let stderrData = '';

    pyProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    pyProcess.on('error', (err) => {
      console.warn(`Failed to run Python with ${cmd}: ${err.message}`);
      if (err.code === 'ENOENT' && cmdIndex < pythonCmds.length - 1) {
        cmdIndex++;
        attemptSpawn();
      } else {
        callback(err, null);
      }
    });

    pyProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const jsonResult = JSON.parse(stdoutData);
          callback(null, jsonResult);
        } catch (e) {
          callback(new Error(`Failed to parse analyzer output: ${stdoutData.substring(0, 200)}`), null);
        }
      } else {
        // Try parsing stderr as JSON error, otherwise treat as text
        let errMsg = stderrData.trim();
        try {
          const jsonErr = JSON.parse(errMsg);
          if (jsonErr && jsonErr.error) {
            errMsg = jsonErr.error;
          }
        } catch (e) {
          // Stderr is plain text
        }
        callback(new Error(errMsg || `Python process exited with code ${code}`), null);
      }
    });
  }

  attemptSpawn();
};

// CSV upload and analysis route
app.post('/api/upload', upload.single('csvFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded or file format not supported.' });
  }

  const filePath = req.file.path;

  runPythonAnalyzer(filePath, (err, data) => {
    // Proactively clean up the uploaded file to save disk space
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) console.error(`Error deleting temp file ${filePath}:`, unlinkErr);
    });

    if (err) {
      console.error('Analysis error:', err.message);
      return res.status(500).json({
        success: false,
        error: err.message || 'An error occurred during file analysis.'
      });
    }

    res.json(data);
  });
});

// Server status route
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', timestamp: new Date() });
});

// Express Error Handler for Multer / general errors
app.use((err, req, res, next) => {
  console.error('Express global error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Server encountered an unexpected error.'
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
