const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: (req, file, cb) => {
    const nombreUnico = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, nombreUnico + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const extensionesPermitidas = /jpg|jpeg|png|webp/;
  const extensionOk = extensionesPermitidas.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = /image\/jpeg|image\/png|image\/webp/.test(file.mimetype);

  if (extensionOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'));
  }
};

module.exports = multer({
  storage,
  fileFilter
});