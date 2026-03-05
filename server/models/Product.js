// Product Model
// DynamoDB-based product model with user ownership

const DynamoDBService = require('../services/dynamodbService');
const logger = require('../utils/logger');
const { DYNAMODB_PRODUCTS_TABLE_NAME } = require('../config/env');

// Initialize DynamoDB service for Products table
const dynamodbService = new DynamoDBService(DYNAMODB_PRODUCTS_TABLE_NAME);

/**
 * Product Schema
 * @typedef {Object} Product
 * @property {string} id - Unique product identifier (productId)
 * @property {string} userId - Owner's user ID (foreign key to User)
 * @property {string} name - Product name
 * @property {string} description - Detailed product description
 * @property {string} shortDescription - Short product description (for listings)
 * @property {string} category - Product category
 * @property {string} status - Product status (draft, active, archived, discontinued)
 * @property {Array<string>} tags - Product tags/keywords
 * @property {string} image - Product thumbnail image URL
 * @property {Array<string>} images - Array of product image URLs
 * @property {string} version - Current version number
 * @property {string} license - Software license type
 * @property {Object} repositories - Frontend/Backend repository information
 * @property {string} repositories.frontend - Frontend code repository URL
 * @property {string} repositories.backend - Backend code repository URL
 * @property {string} repositories.documentation - Documentation repository URL
 * @property {string} website - Product website URL
 * @property {Object} links - Additional product links
 * @property {string} links.demo - Live demo URL
 * @property {string} links.docs - Documentation URL
 * @property {string} links.download - Download page URL
 * @property {string} links.support - Support/Issues URL
 * @property {Object} socialMedia - Social media links
 * @property {string} socialMedia.twitter - Twitter profile URL
 * @property {string} socialMedia.linkedin - LinkedIn page URL
 * @property {string} socialMedia.github - GitHub URL
 * @property {string} socialMedia.youtube - YouTube channel URL
 * @property {string} socialMedia.instagram - Instagram profile URL
 * @property {string} socialMedia.discord - Discord server URL
 * @property {Array<string>} features - Array of product features
 * @property {Array<string>} technologies - Technologies used
 * @property {Object} stats - Product statistics
 * @property {number} stats.downloads - Total downloads
 * @property {number} stats.stars - GitHub stars/follows
 * @property {number} stats.views - Page views
 * @property {number} stats.users - Number of active users
 * @property {number} stats.rating - Average rating (0-5)
 * @property {number} stats.reviews - Number of reviews
 * @property {Object} pricing - Pricing information
 * @property {string} pricing.model - Pricing model (free, freemium, paid)
 * @property {number} pricing.price - Price (if paid)
 * @property {string} pricing.currency - Currency code
 * @property {string} pricing.billingCycle - Billing cycle (monthly, yearly)
 * @property {Array<string>} team - Team member user IDs
 * @property {Date} launchedAt - Product launch date
 * @property {Date} createdAt - Product creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

class Product {
  /**
   * Create a new product
   * @param {Object} productData - Product data object
   * @returns {Promise<Object>} Created product object
   */
  static async create(productData) {
    try {
      logger.info(`Creating new product: ${productData.name}`);

      // Validate required fields
      if (!productData.userId || !productData.name) {
        throw new Error('UserId and name are required');
      }

      // Generate unique product ID
      const productId = `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create product object
      const product = {
        productId: productId,
        userId: productData.userId, // Foreign key to User
        name: productData.name,
        description: productData.description || '',
        shortDescription: productData.shortDescription || '',
        category: productData.category || 'other',
        status: productData.status || 'draft', // draft, active, archived, discontinued
        tags: productData.tags || [],
        image: productData.image || null,
        images: productData.images || [],
        version: productData.version || '1.0.0',
        license: productData.license || 'MIT',
        
        // Repository information
        repositories: {
          frontend: productData.repositories?.frontend || '',
          backend: productData.repositories?.backend || '',
          documentation: productData.repositories?.documentation || '',
        },

        // Product links
        website: productData.website || '',
        links: {
          demo: productData.links?.demo || '',
          docs: productData.links?.docs || '',
          download: productData.links?.download || '',
          support: productData.links?.support || '',
        },

        // Social media links
        socialMedia: {
          twitter: productData.socialMedia?.twitter || '',
          linkedin: productData.socialMedia?.linkedin || '',
          github: productData.socialMedia?.github || '',
          youtube: productData.socialMedia?.youtube || '',
          instagram: productData.socialMedia?.instagram || '',
          discord: productData.socialMedia?.discord || '',
        },

        // Product features and tech
        features: productData.features || [],
        technologies: productData.technologies || [],

        // Statistics
        stats: {
          downloads: productData.stats?.downloads || 0,
          stars: productData.stats?.stars || 0,
          views: productData.stats?.views || 0,
          users: productData.stats?.users || 0,
          rating: productData.stats?.rating || 0,
          reviews: productData.stats?.reviews || 0,
        },

        // Pricing information
        pricing: {
          model: productData.pricing?.model || 'free', // free, freemium, paid
          price: productData.pricing?.price || 0,
          currency: productData.pricing?.currency || 'USD',
          billingCycle: productData.pricing?.billingCycle || null,
        },

        // Team members
        team: productData.team || [],

        // Timestamps
        launchedAt: productData.launchedAt || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to DynamoDB
      const result = await dynamodbService.createItem(product);
      if (!result.success) {
        throw new Error('Failed to create product in database');
      }

      logger.info(`Product created successfully: ${productId}`);
      return product;
    } catch (error) {
      logger.error(`Error creating product: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find product by ID
   * @param {string} id - Product ID
   * @returns {Promise<Object|null>} Product object or null
   */
  static async findById(id) {
    try {
      logger.info(`Finding product by ID: ${id}`);

      const result = await dynamodbService.getItem(id, 'productId');
      if (!result.success || !result.data) {
        logger.warn(`Product not found: ${id}`);
        return null;
      }

      return result.data;
    } catch (error) {
      logger.error(`Error finding product by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find products by user ID
   * @param {string} userId - User ID (owner)
   * @param {number} limit - Maximum number of products to return
   * @returns {Promise<Array>} Array of product objects
   */
  static async findByUserId(userId, limit = 100) {
    try {
      logger.info(`Finding products for user: ${userId}`);

      const result = await dynamodbService.scan({
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        Limit: limit,
      });

      if (!result.success) {
        throw new Error('Failed to fetch user products');
      }

      logger.info(`Found ${result.data.length} products for user: ${userId}`);
      return result.data;
    } catch (error) {
      logger.error(`Error finding products by user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find products by category
   * @param {string} category - Product category
   * @param {number} limit - Maximum number of products to return
   * @returns {Promise<Array>} Array of product objects
   */
  static async findByCategory(category, limit = 100) {
    try {
      logger.info(`Finding products in category: ${category}`);

      const result = await dynamodbService.scan({
        FilterExpression: 'category = :category',
        ExpressionAttributeValues: {
          ':category': category,
        },
        Limit: limit,
      });

      if (!result.success) {
        throw new Error('Failed to fetch products by category');
      }

      logger.info(`Found ${result.data.length} products in category: ${category}`);
      return result.data;
    } catch (error) {
      logger.error(`Error finding products by category: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find products by status
   * @param {string} status - Product status
   * @param {number} limit - Maximum number of products to return
   * @returns {Promise<Array>} Array of product objects
   */
  static async findByStatus(status, limit = 100) {
    try {
      logger.info(`Finding products with status: ${status}`);

      const result = await dynamodbService.scan({
        FilterExpression: 'attribute_exists(#status) AND #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': status,
        },
        Limit: limit,
      });

      if (!result.success) {
        throw new Error('Failed to fetch products by status');
      }

      return result.data;
    } catch (error) {
      logger.error(`Error finding products by status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search products by name or tags
   * @param {string} searchTerm - Search term
   * @param {number} limit - Maximum number of products to return
   * @returns {Promise<Array>} Array of matching products
   */
  static async search(searchTerm, limit = 50) {
    try {
      logger.info(`Searching products for: ${searchTerm}`);

      const lowerSearchTerm = searchTerm.toLowerCase();
      
      const result = await dynamodbService.scan({
        Limit: limit,
      });

      if (!result.success) {
        throw new Error('Failed to search products');
      }

      // Filter results locally (DynamoDB doesn't support substring searches efficiently)
      const filtered = result.data.filter(
        product =>
          product.name.toLowerCase().includes(lowerSearchTerm) ||
          product.description.toLowerCase().includes(lowerSearchTerm) ||
          product.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm))
      );

      logger.info(`Search returned ${filtered.length} results`);
      return filtered;
    } catch (error) {
      logger.error(`Error searching products: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update product
   * @param {string} id - Product ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated product object
   */
  static async updateById(id, updateData) {
    try {
      logger.info(`Updating product: ${id}`);

      // Add updated timestamp
      updateData.updatedAt = new Date().toISOString();

      const result = await dynamodbService.updateItem(id, updateData, 'productId');
      if (!result.success) {
        throw new Error('Failed to update product');
      }

      logger.info(`Product updated successfully: ${id}`);
      return result.data;
    } catch (error) {
      logger.error(`Error updating product: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete product
   * @param {string} id - Product ID
   * @returns {Promise<Object>} Deletion response
   */
  static async deleteById(id) {
    try {
      logger.info(`Deleting product: ${id}`);

      const result = await dynamodbService.deleteItem(id, 'productId');
      if (!result.success) {
        throw new Error('Failed to delete product');
      }

      logger.info(`Product deleted successfully: ${id}`);
      return { success: true, message: 'Product deleted successfully' };
    } catch (error) {
      logger.error(`Error deleting product: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all products
   * @param {number} limit - Maximum number of products to return
   * @returns {Promise<Array>} Array of all products
   */
  static async findAll(limit = 100) {
    try {
      logger.info('Fetching all products');

      const result = await dynamodbService.scan({ Limit: limit });
      if (!result.success) {
        throw new Error('Failed to fetch products');
      }

      return result.data;
    } catch (error) {
      logger.error(`Error fetching all products: ${error.message}`);
      throw error;
    }
  }

}

module.exports = Product;

