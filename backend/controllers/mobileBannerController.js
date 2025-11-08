const MainBanner = require('../models/mobilebanner');
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
    const banner = await MainBanner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });

    if (banner.image) {
      try {
        await deleteFromCloudinary(banner.image);
      } catch (e) {
        console.error('Error deleting image from Cloudinary:', e);
      }
    }

    res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (err) {
    console.error('DELETE BANNER ERROR:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.toggleStatus = async (req, res) => {
  try {
    const banner = await MainBanner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });

    const activeCount = await MainBanner.countDocuments({ isActive: true });
    if (!banner.isActive && activeCount >= 10) {
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
