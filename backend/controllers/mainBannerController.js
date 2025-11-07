const MainBanner = require('../models/MainBanner');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/uploadCloudinary');



exports.create = async (req, res) => {
  try {
    const isActive = req.body.isActive === 'true' || req.body.isActive === true;

    const activeCount = await MainBanner.countDocuments({ isActive: true });

    if (activeCount >= 5 && isActive) {
      return res.status(400).json({ message: 'Only 5 active banners allowed' });
    }

    let image = null;
    if (req.file) {
      try {
        image = await uploadToCloudinary(req.file, 'main-banners'); 
      } catch (uploadErr) {
        console.error('S3 upload error:', uploadErr);
        return res.status(500).json({ success: false, message: 'Image upload failed' });
      }
    }

    // Create banner
    const banner = new MainBanner({
      title: req.body.title,
      subtitle: req.body.subtitle,
      description: req.body.description,
      image,
      link: req.body.link,
      isActive
    });

    await banner.save();
    res.status(201).json({ success: true, banner });
  } catch (err) {
    console.error('CREATE BANNER ERROR:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const banner = await MainBanner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });

    if (req.file) {
      const newImageUrl = await uploadToCloudinary(req.file, 'main-banners');
      banner.image = newImageUrl; 
    }

    banner.title = req.body.title || banner.title;
    banner.subtitle = req.body.subtitle || banner.subtitle;
    banner.description = req.body.description || banner.description;
    banner.link = req.body.link || banner.link;

    await banner.save();

    res.json({ success: true, banner });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.delete = async (req, res) => {
  try {
    const banner = await MainBanner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });

    // 🧹 Delete image from Cloudinary
    if (banner.image) {
      try {
        const publicId = banner.image.split('/').slice(-2).join('/').split('.')[0];
        await deleteFromCloudinary(publicId);
        console.log('✅ Deleted from Cloudinary:', publicId);
      } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
      }
    }

    // 🗑️ Delete banner document
    await banner.deleteOne();
    res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const banner = await MainBanner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });

    const activeCount = await MainBanner.countDocuments({ isActive: true });
    if (!banner.isActive && activeCount >= 5) {
      return res.status(400).json({ message: 'Cannot activate more than 5 banners' });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.json({ success: true, isActive: banner.isActive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAll = async (req, res) => {
  const banners = await MainBanner.find().sort({ createdAt: -1 });
  res.json({ success: true, banners });
};
