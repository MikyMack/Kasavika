const Category = require("../models/Category");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../middleware/uploadCloudinary");

//  Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({});
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  Add Category
exports.addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    let imageUrl = null;

    if (req.file) {
      try {
        imageUrl = await uploadToCloudinary(req.file, "categories");
      } catch (err) {
        console.error("🔥 Cloudinary upload error:", err);
        return res
          .status(500)
          .json({ message: "Image upload failed", error: err.message });
      }
    }

    if (!imageUrl) {
      return res.status(400).json({ message: "Image is required" });
    }

    const newCategory = new Category({ name, imageUrl });
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//  Edit Category
exports.editCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    let imageUrl = category.imageUrl;

    if (req.file) {
      try {
        // Upload new image
        imageUrl = await uploadToCloudinary(req.file, "categories");

        // Delete old image from Cloudinary
        if (category.imageUrl) {
          await deleteFromCloudinary(category.imageUrl);
        }
      } catch (err) {
        console.error("🔥 Cloudinary image update error:", err);
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name, imageUrl },
      { new: true }
    );

    res.json(updatedCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//  Delete Category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Delete category image from Cloudinary
    if (category.imageUrl) {
      await deleteFromCloudinary(category.imageUrl);
    }

    // Delete all subcategory images from Cloudinary
    const subDeletions = category.subCategories.map(async (sub) => {
      if (sub.imageUrl) await deleteFromCloudinary(sub.imageUrl);
    });
    await Promise.allSettled(subDeletions);

    await Category.findByIdAndDelete(id);
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//  Toggle Category
exports.toggleCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    category.isActive = !category.isActive;
    category.subCategories.forEach((sub) => {
      sub.isActive = category.isActive;
    });

    await category.save();
    res.json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//  Add Subcategory
exports.addSubCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name } = req.body;
    let imageUrl = null;

    if (req.file) {
      try {
        imageUrl = await uploadToCloudinary(req.file, "subcategories");
      } catch (err) {
        return res.status(500).json({ message: "Image upload failed" });
      }
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    category.subCategories.push({ name, imageUrl });
    await category.save();

    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//  Edit Subcategory
exports.editSubCategory = async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;
    const { name } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const subcategory = category.subCategories.id(subcategoryId);
    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    let imageUrl = subcategory.imageUrl;

    if (req.file) {
      try {
        imageUrl = await uploadToCloudinary(req.file, "subcategories");

        if (subcategory.imageUrl) {
          await deleteFromCloudinary(subcategory.imageUrl);
        }
      } catch (err) {
        console.error("🔥 Cloudinary subcategory update error:", err);
      }
    }

    subcategory.name = name;
    subcategory.imageUrl = imageUrl;

    await category.save();
    res.json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//  Delete Subcategory
exports.deleteSubCategory = async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const subcategory = category.subCategories.id(subcategoryId);
    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    if (subcategory.imageUrl) {
      await deleteFromCloudinary(subcategory.imageUrl);
    }

    category.subCategories.pull(subcategoryId);
    await category.save();

    res.json({
      success: true,
      message: "Subcategory deleted successfully",
      updatedCategory: category,
    });
  } catch (error) {
    console.error("Error in deleteSubCategory:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//  Toggle Subcategory
exports.toggleSubCategory = async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const subcategory = category.subCategories.id(subcategoryId);
    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    subcategory.isActive = !subcategory.isActive;
    await category.save();

    res.json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
