// Product Controller
const { OK, CREATED, BAD_REQUEST, NOT_FOUND, SERVER_ERROR } = require('../constants/statusCodes');
const { SUCCESS, CREATED_SUCCESSFULLY, NOT_FOUND: NOT_FOUND_MSG } = require('../constants/messages');
const Product = require('../models/Product');

// Get all products
exports.getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.findAll();
    res.status(OK).json({
      success: true,
      message: SUCCESS,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// Get product by ID
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(NOT_FOUND).json({
        success: false,
        message: NOT_FOUND_MSG,
      });
    }

    res.status(OK).json({
      success: true,
      message: SUCCESS,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Create product
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, inventory } = req.body;

    // Add validation logic here
    if (!name || !price || !category) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'Name, price, and category are required',
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      inventory: inventory || 0,
    });

    res.status(CREATED).json({
      success: true,
      message: CREATED_SUCCESSFULLY,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Update product
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedProduct = await Product.updateById(id, updateData);

    if (!updatedProduct) {
      return res.status(NOT_FOUND).json({
        success: false,
        message: NOT_FOUND_MSG,
      });
    }

    res.status(OK).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

// Delete product
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await Product.deleteById(id);

    if (!result) {
      return res.status(NOT_FOUND).json({
        success: false,
        message: NOT_FOUND_MSG,
      });
    }

    res.status(OK).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get products by category
exports.getProductsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const products = await Product.findByCategory(category);

    res.status(OK).json({
      success: true,
      message: SUCCESS,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};
