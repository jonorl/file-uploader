const multer = require("multer");
// const cloudinary = require('../controllers/cloudinary');

const storage = multer.diskStorage({
  
  destination: function (req, file, cb) {
    console.log("req.userDir: ",req.userDir);

    cb(null, `${req.userDir}`);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

let upload = multer({ storage: storage });

upload = upload.single('avatar')

// const cloudinaryUpload = (filePath) => {
//   return cloudinary.uploader.upload(filePath, {
//     resource_type: 'auto'
//   });
// };

module.exports = { upload, /* cloudinaryUpload */ };
