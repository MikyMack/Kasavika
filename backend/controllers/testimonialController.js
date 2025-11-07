const Testimonial = require('../models/Testimonial');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/uploadCloudinary');


// Create Testimonial
exports.createTestimonial = async (req, res) => {
    try {
        const { name, designation, content, rating } = req.body;
        let imageUrl = null;

        if (req.file) {
            try {
                imageUrl = await uploadToCloudinary(req.file, 'testimonials');
            } catch (err) {
                return res.status(500).json({ success: false, error: 'Image upload failed' });
            }
        }

        const testimonial = new Testimonial({
            name,
            designation,
            content,
            rating,
            imageUrl
        });

        await testimonial.save();
        res.status(201).json({ success: true, testimonial });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// List All Testimonials
exports.listTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, testimonials });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get Testimonial For Edit
exports.getTestimonialForEdit = async (req, res) => {
    try {
        const testimonial = await Testimonial.findById(req.params.id);
        if (!testimonial) {
            return res.status(404).json({ success: false, message: 'Testimonial not found' });
        }
        
        res.status(200).json({
            success: true,
            testimonial: {
                _id: testimonial._id,
                name: testimonial.name,
                designation: testimonial.designation,
                content: testimonial.content,
                rating: testimonial.rating,
                imageUrl: testimonial.imageUrl,
                isActive: testimonial.isActive
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Server error: ' + error.message 
        });
    }
};

// Update Testimonial
exports.updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const testimonial = await Testimonial.findById(id);
    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }

    // If new image is uploaded, replace old one in Cloudinary
    if (req.file) {
      try {
        // Delete old image from Cloudinary (if exists)
        if (testimonial.imageUrl) {
          await deleteFromCloudinary(testimonial.imageUrl);
        }

        // Upload new image
        updateData.imageUrl = await uploadToCloudinary(req.file, 'testimonials');
      } catch (err) {
        console.error('Cloudinary image update failed:', err);
        return res.status(500).json({ success: false, error: 'Image update failed' });
      }
    }

    // Update fields
    testimonial.name = updateData.name || testimonial.name;
    testimonial.designation = updateData.designation || testimonial.designation;
    testimonial.content = updateData.content || testimonial.content;
    testimonial.rating = updateData.rating || testimonial.rating;
    if (updateData.imageUrl) testimonial.imageUrl = updateData.imageUrl;

    await testimonial.save();
    res.status(200).json({ success: true, testimonial });
  } catch (error) {
    console.error('Update testimonial error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete Testimonial
exports.deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const testimonial = await Testimonial.findById(id);
    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }

    // Delete image from Cloudinary if exists
    if (testimonial.imageUrl) {
      try {
        await deleteFromCloudinary(testimonial.imageUrl);
      } catch (e) {
        console.error('Failed to delete testimonial image from Cloudinary:', e);
      }
    }

    await Testimonial.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Testimonial deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// Toggle isActive Status
exports.toggleTestimonialStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const testimonial = await Testimonial.findById(id);
        if (!testimonial) {
            return res.status(404).json({ success: false, message: 'Testimonial not found' });
        }
        testimonial.isActive = !testimonial.isActive;
        await testimonial.save();

        res.status(200).json({ 
            success: true, 
            message: `Testimonial ${testimonial.isActive ? 'activated' : 'deactivated'} successfully`,
            testimonial 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};