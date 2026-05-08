import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth';
import { uploadFile, uploadReport } from '../controllers/upload.controller';

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const folder = req.query.type === 'scan' ? 'scans' : 'reports';
    cb(null, path.join(__dirname, '../../uploads', folder));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF are allowed.'));
    }
  },
});

const router = Router();
router.use(authenticate);
router.post('/file', upload.single('file'), uploadFile);
router.post('/report/:patientId', upload.single('file'), uploadReport);

export default router;
