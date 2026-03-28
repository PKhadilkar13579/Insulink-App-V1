/*const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir = './file/';

    if (file.mimetype.includes('image')) {
      uploadDir += 'image/';
    } else if (file.mimetype.includes('pdf')) {
      uploadDir += 'pdf/';
    } else if (file.mimetype.includes('excel')) {
      uploadDir += 'excel/';
    } else if (file.mimetype.includes('zip')) {
      uploadDir += 'zip/';
    } else if (file.mimetype.includes('csv')) {
      uploadDir += 'csv/';
    } else {
      uploadDir += 'other/';
    }

    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const fileExtension = path.extname(file.originalname);
    cb(null, file.originalname.split('.')[0] + '-' + Date.now() + fileExtension);
  }
});

const upload = multer({ storage: storage });

module.exports = upload;*/

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir = './file/';

    if (file.mimetype.includes('image')) {
      uploadDir += 'image/';
    } else if (file.mimetype.includes('pdf')) {
      uploadDir += 'pdf/';
    } else if (file.mimetype.includes('zip')) {
      uploadDir += 'zip/';
    } else if (file.mimetype.includes('csv')) {
      uploadDir += 'csv/';
    } else {
      uploadDir += 'other/';
    }

    // 🔥 ensure folder exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const fileExtension = path.extname(file.originalname);
    const uniqueName =
      file.originalname.split('.')[0] +
      '-' +
      Date.now() +
      fileExtension;

    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

module.exports = upload;