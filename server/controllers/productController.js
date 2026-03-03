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

// Generate a platform-specific marketing post (with optional image/video)
exports.generatePost = async (req, res, next) => {
  try {
    const {
      productId,
      brand_name,
      post_language = 'english',
      tone,
      input_text,
      platform,
      generateImage = false,
      generateVideo = false,
      imageDetails = {},
      videoDetails = {},
    } = req.body;

    // productId is always required
    if (!productId) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'productId is required.',
      });
    }

    // ----------------------------------------------------------------
    // 1. Validation
    // ----------------------------------------------------------------
    if (generateImage && generateVideo) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'generateImage and generateVideo cannot both be true at the same time.',
      });
    }

    if (generateImage && (!imageDetails || Object.keys(imageDetails).length === 0)) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'imageDetails is required when generateImage is true.',
      });
    }

    if (generateVideo && (!videoDetails || Object.keys(videoDetails).length === 0)) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'videoDetails is required when generateVideo is true.',
      });
    }

    // ----------------------------------------------------------------
    // 2. Fetch product from DB using productId
    // ----------------------------------------------------------------
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(NOT_FOUND).json({
        success: false,
        message: `Product not found: ${productId}`,
      });
    }

    const product_name = product.name;
    const product_category = product.category;

    // ----------------------------------------------------------------
    // 3. Validate remaining required fields
    // ----------------------------------------------------------------
    const requiredFields = { brand_name, tone, platform };
    const missingFields = Object.entries(requiredFields)
      .filter(([, v]) => v === undefined || v === null || v === '')
      .map(([k]) => k);

    if (missingFields.length > 0) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    // Normalise to lowercase for enum checks
    const normLanguage = post_language.toLowerCase();
    const normTone     = tone.toLowerCase();
    const normPlatform = platform.toLowerCase();

    const ALLOWED_LANGUAGES = ['english', 'hindi-in-english', 'hinglish'];
    const ALLOWED_TONES     = ['energetic', 'professional', 'casual', 'witty'];
    const ALLOWED_PLATFORMS = ['instagram', 'linkedin', 'twitter', 'facebook', 'youtube'];

    if (!ALLOWED_LANGUAGES.includes(normLanguage)) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: `Invalid post_language. Allowed values: ${ALLOWED_LANGUAGES.join(', ')}`,
      });
    }

    if (!ALLOWED_TONES.includes(normTone)) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: `Invalid tone. Allowed values: ${ALLOWED_TONES.join(', ')}`,
      });
    }

    if (!ALLOWED_PLATFORMS.includes(normPlatform)) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: `Invalid platform. Allowed values: ${ALLOWED_PLATFORMS.join(', ')}`,
      });
    }

    // ----------------------------------------------------------------
    // 4. Build platform-optimised postPrompt
    // ----------------------------------------------------------------
    const platformCTAs = {
      instagram: 'Tap the link in bio to explore now!',
      linkedin:  'Connect with us or visit our website to learn more.',
      twitter:   'Check it out and retweet to spread the word!',
      facebook:  'Share this with someone who needs it and click the link to get started.',
      youtube:   'Subscribe and hit the bell icon so you never miss an update.',
    };

    const platformStyles = {
      instagram: 'visual-first, emoji-heavy, storytelling caption (150-300 words, 5-8 hashtags)',
      linkedin:  'professional but human, insight-led, bold hook (200-300 words, 3-5 hashtags, end with a question)',
      twitter:   'punchy, witty, conversational thread (main post under 280 chars, 2-3 hashtags)',
      facebook:  'community-focused, conversational, warm (150-250 words, 3-5 hashtags)',
      youtube:   'engaging, informative, drives watch intent (200-350 words, 4-6 hashtags)',
    };

    const postPromptParts = [
      `Write a ${platformStyles[normPlatform]} marketing post for ${normPlatform}.`,
      `Product: ${product_name}.`,
      `Category: ${product_category}.`,
      `Brand: ${brand_name}.`,
      `Language: ${normLanguage}.`,
      `Tone: ${normTone}.`,
      input_text ? `Additional context: ${input_text}.` : '',
      `End with a clear call-to-action: ${platformCTAs[normPlatform]}`,
    ];

    const postPrompt = postPromptParts.filter(Boolean).join(' ');

    // ----------------------------------------------------------------
    // 5. Call post generation Lambda
    // ----------------------------------------------------------------
    const postLambdaBody = {
      product_name,
      product_category,
      brand_name,
      post_language: normLanguage,
      tone:          normTone,
      input_text:    postPrompt,
      platform:      normPlatform,
    };

    logger.info(`\n===== POST GENERATION LAMBDA BODY =====\n${JSON.stringify(postLambdaBody, null, 2)}\n=======================================`);

    const postResult = await lambdaService.generatePost(postLambdaBody);
    const postResponse = postResult.data;

    // ----------------------------------------------------------------
    // 6. Optionally generate image
    // ----------------------------------------------------------------
    let imageResponse = null;
    if (generateImage) {
      const finalImagePromptParts = [
        'Create a high-converting marketing advertisement image.',
        `Product: ${product_name}.`,
        `Category: ${product_category}.`,
        `Brand: ${brand_name}.`,
        `Tone: ${tone}.`,
        `Optimised for ${platform}.`,
        imageDetails.sceneType ? `Scene: ${imageDetails.sceneType}.` : '',
        imageDetails.lighting ? `Lighting: ${imageDetails.lighting}.` : '',
        imageDetails.composition ? `Composition: ${imageDetails.composition}.` : '',
        'The image must be visually rich, emotionally compelling, and optimised for commercial advertising.',
      ];

      const finalImagePrompt = finalImagePromptParts.filter(Boolean).join(' ');

      const imageLambdaBody = {
        input_text: finalImagePrompt,
        negative_text: 'low quality, blurry, distorted, watermark, bad lighting',
        style: imageDetails.style,
        width: imageDetails.width,
        height: imageDetails.height,
        quality: imageDetails.quality,
        cfgScale: imageDetails.cfgScale,
        seed: imageDetails.seed || 0,
        numberOfImages: imageDetails.numberOfImages || 1,
      };

      logger.info(`\n===== IMAGE LAMBDA BODY =====\n${JSON.stringify(imageLambdaBody, null, 2)}\n=============================`);

      const imageResult = await lambdaService.generateImageAd(imageLambdaBody);
      imageResponse = imageResult.data;
    }

    // ----------------------------------------------------------------
    // 7. Optionally generate video
    // ----------------------------------------------------------------
    let videoResponse = null;
    if (generateVideo) {
      const finalVideoPromptParts = [
        'Create a high-converting marketing advertisement video.',
        `Product: ${product_name}.`,
        `Category: ${product_category}.`,
        `Brand: ${brand_name}.`,
        `Tone: ${tone}.`,
        `Optimised for ${platform}.`,
        videoDetails.duration ? `Duration: ${videoDetails.duration} seconds.` : '',
        videoDetails.voiceStyle ? `Voice style: ${videoDetails.voiceStyle}.` : '',
        videoDetails.backgroundMusicMood ? `Background music mood: ${videoDetails.backgroundMusicMood}.` : '',
        videoDetails.aspectRatio ? `Aspect ratio: ${videoDetails.aspectRatio}.` : '',
        videoDetails.resolution ? `Resolution: ${videoDetails.resolution}.` : '',
        'Ensure the video feels professional, emotionally engaging, and drives conversions.',
      ];

      const finalVideoPrompt = finalVideoPromptParts.filter(Boolean).join(' ');

      const videoLambdaBody = {
        input_text: finalVideoPrompt,
        duration: videoDetails.duration,
        seed: 0,
      };

      logger.info(`\n===== VIDEO LAMBDA BODY =====\n${JSON.stringify(videoLambdaBody, null, 2)}\n=============================`);

      const videoResult = await lambdaService.generateVideo(videoLambdaBody);
      videoResponse = videoResult.data;
    }

    // ----------------------------------------------------------------
    // 8. Return unified response
    // ----------------------------------------------------------------
    return res.status(OK).json({
      post: postResponse,
      image: imageResponse,
      video: videoResponse,
    });
  } catch (error) {
    next(error);
  }
};

// Generate a marketing image advertisement via Lambda
exports.generateImageAd = async (req, res, next) => {
  try {
    const {
      campaignGoal,
      targetAudience,
      tone,
      stylePreference,
      sceneType,
      lighting,
      composition,
      brandColors,
      tagline,
      offerText,
      ctaText,
      negative_text,
      style,
      width,
      height,
      quality,
      cfgScale,
      seed,
      numberOfImages,
    } = req.body;

    // Validate required fields
    const requiredFields = {
      campaignGoal,
      tone,
      sceneType,
      lighting,
      composition,
      style,
      width,
      height,
      quality,
      cfgScale,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) => value === undefined || value === null || value === '')
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    // Build finalPrompt — a single, rich, descriptive paragraph
    const promptParts = [
      'Create a high-converting marketing advertisement image.',

      campaignGoal
        ? `The campaign goal is to ${campaignGoal}.`
        : '',
      targetAudience
        ? `The target audience is ${targetAudience}.`
        : '',
      tone
        ? `The overall tone of the ad should be ${tone}.`
        : '',
      sceneType
        ? `The scene should depict ${sceneType}.`
        : '',
      lighting
        ? `Lighting: ${lighting}.`
        : '',
      composition
        ? `Composition: ${composition}.`
        : '',
      stylePreference
        ? `Visual style preference: ${stylePreference}.`
        : '',
      brandColors && brandColors.length
        ? `Incorporate the brand color palette: ${brandColors.join(', ')}.`
        : '',
      tagline
        ? `Feature the tagline: "${tagline}".`
        : '',
      offerText
        ? `Highlight the offer: "${offerText}".`
        : '',
      ctaText
        ? `Include a clear call-to-action: "${ctaText}".`
        : '',
      'The image must be visually rich, emotionally compelling, and optimized for commercial advertising.',
    ];

    const finalPrompt = promptParts.filter(Boolean).join(' ');

    const negativeText =
      negative_text ||
      'low quality, blurry, distorted, extra limbs, bad lighting, watermark, noisy background';

    // Build Lambda request body
    const lambdaBody = {
      input_text: finalPrompt,
      negative_text: negativeText,
      style,
      width,
      height,
      quality,
      cfgScale,
      seed: seed || 0,
      numberOfImages: numberOfImages || 1,
    };

    console.log('\n===== IMAGE AD LAMBDA REQUEST BODY =====');
    console.log(JSON.stringify(lambdaBody, null, 2));
    console.log('=========================================\n');

    const result = await lambdaService.generateImageAd(lambdaBody);

    // Return Lambda response directly
    return res.status(OK).json(result.data);
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
