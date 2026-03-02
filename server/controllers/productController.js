// Product Controller
const { OK, CREATED, BAD_REQUEST, NOT_FOUND, SERVER_ERROR, UNAUTHORIZED } = require('../constants/statusCodes');
const { SUCCESS, CREATED_SUCCESSFULLY, NOT_FOUND: NOT_FOUND_MSG } = require('../constants/messages');
const Product = require('../models/Product');
const User = require('../models/User');
const logger = require('../utils/logger');
const lambdaService = require('../services/lambdaService');

// Get all products
exports.getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.findAll();
    res.status(OK).json({
      success: true,
      message: SUCCESS,
      data: products,
      count: products.length,
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
    const {
      userId,
      name,
      description,
      shortDescription,
      category,
      tags,
      repositories,
      website,
      links,
      socialMedia,
      features,
      technologies,
      pricing,
    } = req.body;

    // Add validation logic here
    if (!userId || !name) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'UserId and name are required',
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(NOT_FOUND).json({
        success: false,
        message: 'User not found',
      });
    }

    const product = await Product.create({
      userId,
      name,
      description,
      shortDescription,
      category,
      tags,
      repositories,
      website,
      links,
      socialMedia,
      features,
      technologies,
      pricing,
    });

    // Add product to user's products
    await User.addProduct(userId, product.id);

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

    // Get product to find owner
    const product = await Product.findById(id);
    if (!product) {
      return res.status(NOT_FOUND).json({
        success: false,
        message: NOT_FOUND_MSG,
      });
    }

    // Remove from user's products
    await User.removeProduct(product.userId, id);

    const result = await Product.deleteById(id);

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
      count: products.length,
    });
  } catch (error) {
    next(error);
  }
};

// Get products by user
exports.getProductsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(NOT_FOUND).json({
        success: false,
        message: 'User not found',
      });
    }

    const products = await Product.findByUserId(userId);

    res.status(OK).json({
      success: true,
      message: SUCCESS,
      data: products,
      count: products.length,
    });
  } catch (error) {
    next(error);
  }
};

// Get products by status
exports.getProductsByStatus = async (req, res, next) => {
  try {
    const { status } = req.params;

    const products = await Product.findByStatus(status);

    res.status(OK).json({
      success: true,
      message: SUCCESS,
      data: products,
      count: products.length,
    });
  } catch (error) {
    next(error);
  }
};

// Search products
exports.searchProducts = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const products = await Product.search(q);

    res.status(OK).json({
      success: true,
      message: SUCCESS,
      data: products,
      count: products.length,
    });
  } catch (error) {
    next(error);
  }
};

// Publish product
exports.publishProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.publish(id);

    res.status(OK).json({
      success: true,
      message: 'Product published successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Archive product
exports.archiveProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.archive(id);

    res.status(OK).json({
      success: true,
      message: 'Product archived successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Update product statistics
exports.updateProductStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { downloads, stars, views, users, rating, reviews } = req.body;

    const statData = {};
    if (downloads !== undefined) statData.downloads = downloads;
    if (stars !== undefined) statData.stars = stars;
    if (views !== undefined) statData.views = views;
    if (users !== undefined) statData.users = users;
    if (rating !== undefined) statData.rating = rating;
    if (reviews !== undefined) statData.reviews = reviews;

    const product = await Product.updateStats(id, statData);

    res.status(OK).json({
      success: true,
      message: 'Product statistics updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Increment download count
exports.incrementDownloads = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(NOT_FOUND).json({
        success: false,
        message: NOT_FOUND_MSG,
      });
    }

    const newDownloadCount = (product.stats?.downloads || 0) + 1;
    const updated = await Product.updateStats(id, { downloads: newDownloadCount });

    res.status(OK).json({
      success: true,
      message: 'Download count updated',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// Increment views
exports.incrementViews = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(NOT_FOUND).json({
        success: false,
        message: NOT_FOUND_MSG,
      });
    }

    const newViewCount = (product.stats?.views || 0) + 1;
    const updated = await Product.updateStats(id, { views: newViewCount });

    res.status(OK).json({
      success: true,
      message: 'View count updated',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// Add team member
exports.addTeamMember = async (req, res, next) => {
  try {
    const { productId, userId } = req.body;

    if (!productId || !userId) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'ProductId and userId are required',
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(NOT_FOUND).json({
        success: false,
        message: 'User not found',
      });
    }

    const product = await Product.addTeamMember(productId, userId);

    res.status(OK).json({
      success: true,
      message: 'Team member added successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Remove team member
exports.removeTeamMember = async (req, res, next) => {
  try {
    const { productId, userId } = req.body;

    if (!productId || !userId) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'ProductId and userId are required',
      });
    }

    const product = await Product.removeTeamMember(productId, userId);

    res.status(OK).json({
      success: true,
      message: 'Team member removed successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Get trending products
exports.getTrendingProducts = async (req, res, next) => {
  try {
    const limit = req.query.limit || 10;
    const products = await Product.getTrending(parseInt(limit));

    res.status(OK).json({
      success: true,
      message: SUCCESS,
      data: products,
      count: products.length,
    });
  } catch (error) {
    next(error);
  }
};

// Get product with owner details
exports.getProductWithOwner = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(NOT_FOUND).json({
        success: false,
        message: NOT_FOUND_MSG,
      });
    }

    // Get owner details
    const owner = await User.findById(product.userId);

    res.status(OK).json({
      success: true,
      message: SUCCESS,
      data: {
        ...product,
        owner: owner || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get AI-generated questions for a product (via external Lambda Function URL)
exports.getProductQuestions = async (req, res, next) => {
  try {
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'product_id is required',
      });
    }

    const result = await lambdaService.getProductQuestions(product_id);

    res.status(OK).json({
      success: true,
      message: SUCCESS,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

// Generate a marketing video via Lambda
exports.generateVideo = async (req, res, next) => {
  try {
    const {
      productId,
      campaignGoal,
      targetAudience = {},
      tone,
      adStyle,
      platform,
      hookStyle,
      cta = {},
      branding = {},
      audio = {},
      videoSettings = {},
    } = req.body;

    // Only productId and videoSettings.duration are strictly required
    // if (!productId) {
    //   return res.status(BAD_REQUEST).json({
    //     success: false,
    //     message: 'productId is required.',
    //   });
    // }

    if (!videoSettings.duration) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'videoSettings.duration is required.',
      });
    }

    // Build finalPrompt — every field is optional beyond the two required above
    const promptParts = [
      'Create a high-converting marketing advertisement video.',
      `Product ID: ${productId}.`,
      campaignGoal ? `Campaign Goal: ${campaignGoal}.` : '',

      // Target audience
      targetAudience.ageGroup ? `Target age group: ${targetAudience.ageGroup}.` : '',
      targetAudience.audienceType ? `Audience type: ${targetAudience.audienceType}.` : '',
      targetAudience.location ? `Location: ${targetAudience.location}.` : '',
      targetAudience.gender ? `Gender focus: ${targetAudience.gender}.` : '',
      targetAudience.incomeLevel ? `Income level: ${targetAudience.incomeLevel}.` : '',
      targetAudience.painPoint ? `Key pain point to address: ${targetAudience.painPoint}.` : '',
      targetAudience.interests && targetAudience.interests.length
        ? `Audience interests: ${targetAudience.interests.join(', ')}.`
        : '',

      // Creative direction
      tone ? `Ad tone: ${tone}.` : '',
      adStyle ? `Ad style: ${adStyle}.` : '',
      platform ? `Optimized for platform: ${platform}.` : '',
      hookStyle
        ? `Hook style: ${hookStyle} — open with a compelling hook that grabs attention within the first 3 seconds.`
        : '',

      // CTA
      cta.type ? `Call to Action: "${cta.type}".` : '',
      cta.urgency ? `CTA urgency: ${cta.urgency}.` : '',
      cta.offerText ? `Offer: "${cta.offerText}".` : '',
      cta.promoCode ? `Promo code: "${cta.promoCode}".` : '',

      // Branding
      branding.tagline ? `Brand tagline: "${branding.tagline}".` : '',
      branding.websiteUrl ? `Direct viewers to: ${branding.websiteUrl}.` : '',
      branding.logoUrl
        ? `Include brand logo positioned at the ${branding.logoPosition || 'top-right'} of the frame.`
        : '',
      branding.brandColors && branding.brandColors.length
        ? `Brand color palette: ${branding.brandColors.join(', ')}.`
        : '',
      branding.watermark === true ? 'Apply a subtle watermark throughout the video.' : '',

      // Audio
      audio.voiceGender ? `Voice: ${audio.voiceGender}.` : '',
      audio.accent ? `Accent: ${audio.accent}.` : '',
      audio.energyLevel ? `Voice energy level: ${audio.energyLevel}.` : '',
      audio.voiceStyle ? `Voice style: ${audio.voiceStyle}.` : '',
      audio.speed ? `Speech speed: ${audio.speed}x.` : '',
      audio.backgroundMusicMood ? `Background music mood: ${audio.backgroundMusicMood}.` : '',

      // Video settings
      `Video duration: ${videoSettings.duration} seconds.`,
      videoSettings.aspectRatio ? `Aspect ratio: ${videoSettings.aspectRatio}.` : '',
      videoSettings.resolution ? `Resolution: ${videoSettings.resolution}.` : '',
      videoSettings.fps ? `Frame rate: ${videoSettings.fps} fps.` : '',
      videoSettings.subtitleStyle ? `Subtitle style: ${videoSettings.subtitleStyle}.` : '',

      'Ensure the video feels professional, emotionally engaging, and drives direct conversions.',
    ];

    const finalPrompt = promptParts.filter(Boolean).join(' ');

    // Call the video generation Lambda via axios
    const lambdaBody = {
      input_text: finalPrompt,
      duration: videoSettings.duration,
      seed: 42,
    };

    console.log('\n===== LAMBDA REQUEST BODY =====');
    console.log(JSON.stringify(lambdaBody, null, 2));
    console.log('================================\n');

    const result = await lambdaService.generateVideo(lambdaBody);

    // Return Lambda response directly
    return res.status(OK).json(result.data);
  } catch (error) {
    next(error);
  }
};
