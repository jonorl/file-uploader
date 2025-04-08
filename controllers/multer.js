// Multer

const multer  = require('multer')
let upload = multer({ dest: '../file-uploader/uploads' })

upload = upload.single('avatar')

module.exports = { upload };