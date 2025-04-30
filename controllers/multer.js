const multer = require("multer");

const storage = multer.diskStorage({
  
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

let upload = multer({ storage: storage });

upload = upload.single('avatar')

module.exports = { upload };
