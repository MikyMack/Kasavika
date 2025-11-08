const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary'); 

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    const baseName = file.originalname.split('.')[0].toLowerCase().replace(/\s+/g, '-');
    const seoSafeName = baseName.replace(/[^a-z0-9\-]/g, '');
    return {
      folder: 'Kasavika', // Cloudinary folder name
      public_id: `${Date.now()}-${seoSafeName}`,
      allowed_formats: ['jpeg', 'jpg', 'png', 'webp'],
      transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
    };
  },
});

// Initialize multer with Cloudinary storage
const multerUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const mimeType = allowedTypes.test(file.mimetype);
    if (mimeType) cb(null, true);
    else cb(new Error('Only JPEG, JPG, PNG, and WEBP images are allowed'), false);
  },
  limits: { fileSize: 50 * 1024 * 1024, fieldSize: 50 * 1024 * 1024 },
});

// Upload to Cloudinary (returns image URL)
const uploadToCloudinary = async (file, folder = 'Kasavika') => {
  try {
    const result = await cloudinary.uploader.upload(file.path, { folder });
    return result.secure_url;
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    throw err;
  }
};

//  Delete image from Cloudinary by public ID
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Deleted from Cloudinary:', result);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

module.exports = {
  multerUpload,
  uploadToCloudinary,
  deleteFromCloudinary
};
