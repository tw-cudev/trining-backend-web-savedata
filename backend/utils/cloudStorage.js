const cloudinary = require("cloudinary").v2

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Upload file to Cloudinary
 * @param {Object} file - Multer file object
 * @param {String} userId - User ID for folder organization
 * @returns {Promise} Cloudinary response
 */
const uploadToCloudinary = (file, userId) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `file-storage/${userId}`,
        resource_type: "auto",
        public_id: `${Date.now()}-${file.originalname}`,
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      },
    )

    stream.end(file.buffer)
  })
}

module.exports = { uploadToCloudinary }
