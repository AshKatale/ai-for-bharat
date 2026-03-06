// User Model
// DynamoDB-based user model with product ownership

const DynamoDBService = require('../services/dynamodbService');
const logger = require('../utils/logger');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { DYNAMODB_USERS_TABLE_NAME } = require('../config/env');

// Initialize DynamoDB service for Users table
const dynamodbService = new DynamoDBService(DYNAMODB_USERS_TABLE_NAME);

/**
 * User Schema
 * @typedef {Object} User
 * @property {string} id - Unique user identifier (userId)
 * @property {string} name - User's full name
 * @property {string} email - User's email address (unique)
 * @property {string} password - Hashed password
 * @property {string} username - Unique username
 * @property {string} bio - User's biography
 * @property {string} profileImage - URL to profile image
 * @property {string} company - User's company/organization
 * @property {string} location - User's location
 * @property {string} website - User's website URL
 * @property {Array<string>} products - Array of owned product IDs (foreign keys)
 * @property {Object} socialLinks - Social media links
 * @property {string} socialLinks.twitter - Twitter profile URL
 * @property {string} socialLinks.linkedin - LinkedIn profile URL
 * @property {string} socialLinks.github - GitHub profile URL
 * @property {string} socialLinks.instagram - Instagram profile URL
 * @property {string} role - User role (user, moderator, admin)
 * @property {boolean} isVerified - Email verification status
 * @property {boolean} isActive - Account active status
 * @property {Date} createdAt - Account creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

class User {
  /**
   * Create a new user
   * @param {Object} userData - User data object
   * @returns {Promise<Object>} Created user object
   */
  static async create(userData) {
    try {
      logger.info(`Creating new user: ${userData.email}`);

      // Validate required fields
      if (!userData.email || !userData.password || !userData.name) {
        throw new Error('Email, password, and name are required');
      }

      // Check if user already exists
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await this._hashPassword(userData.password);

      // Generate unique user ID
      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create user object
      const user = {
        userId: userId,
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        username: userData.username || this._generateUsername(userData.name),
        bio: userData.bio || '',
        profileImage: userData.profileImage || null,
        company: userData.company || '',
        location: userData.location || '',
        website: userData.website || '',
        products: userData.products || [], // Array of product IDs owned by user
        socialLinks: {
          twitter: userData.socialLinks?.twitter || '',
          linkedin: userData.socialLinks?.linkedin || '',
          github: userData.socialLinks?.github || '',
          instagram: userData.socialLinks?.instagram || '',
        },
        role: userData.role || 'user', // user, moderator, admin
        isVerified: userData.isVerified || false,
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to DynamoDB
      const result = await dynamodbService.createItem(user);
      if (!result.success) {
        throw new Error('Failed to create user in database');
      }

      logger.info(`User created successfully: ${userId}`);

      // Return user without password
      return this._omitPassword(user);
    } catch (error) {
      logger.error(`Error creating user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  static async findById(userId) {
    try {
      logger.info(`Finding user by ID: ${userId}`);

      const result = await dynamodbService.getItem(userId, 'userId');
      if (!result.success || !result.data) {
        logger.warn(`User not found: ${userId}`);
        return null;
      }

      return this._omitPassword(result.data);
    } catch (error) {
      logger.error(`Error finding user by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find user by email (includes password for authentication)
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object with password or null
   */
  static async findByEmailWithPassword(email) {
    try {
      logger.info(`Finding user by email with password: ${email}`);

      const result = await dynamodbService.scan({
        FilterExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email,
        },
      });

      if (!result.success || result.data.length === 0) {
        logger.warn(`User not found with email: ${email}`);
        return null;
      }

      const user = result.data[0];
      logger.info(`User found: ${email}, password field exists: ${!!user.password}, password type: ${typeof user.password}`);
      if (user.password) {
        logger.debug(`Password hash length: ${user.password.length}, first 20 chars: ${user.password.substring(0, 20)}...`);
      }
      
      return user; // Return with password included
    } catch (error) {
      logger.error(`Error finding user by email with password: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByEmail(email) {
    try {
      logger.info(`Finding user by email: ${email}`);

      const result = await dynamodbService.scan({
        FilterExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email,
        },
      });

      if (!result.success || result.data.length === 0) {
        logger.warn(`User not found with email: ${email}`);
        return null;
      }

      return this._omitPassword(result.data[0]);
    } catch (error) {
      logger.error(`Error finding user by email: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find user by username
   * @param {string} username - User username
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByUsername(username) {
    try {
      logger.info(`Finding user by username: ${username}`);

      const result = await dynamodbService.scan({
        FilterExpression: 'username = :username',
        ExpressionAttributeValues: {
          ':username': username,
        },
      });

      if (!result.success || result.data.length === 0) {
        logger.warn(`User not found with username: ${username}`);
        return null;
      }

      return this._omitPassword(result.data[0]);
    } catch (error) {
      logger.error(`Error finding user by username: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update user
   * @param {string} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user object
   */
  static async updateById(userId, updateData) {
    try {
      logger.info(`Updating user: ${userId}`);

      // Prevent password update through this method
      if (updateData.password) {
        delete updateData.password;
      }

      // Add updated timestamp
      updateData.updatedAt = new Date().toISOString();

      const result = await dynamodbService.updateItem(userId, updateData, 'userId');
      if (!result.success) {
        throw new Error('Failed to update user');
      }

      logger.info(`User updated successfully: ${userId}`);
      return this._omitPassword(result.data);
    } catch (error) {
      logger.error(`Error updating user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update user password
   * @param {string} id - User ID
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Success response
   */
  static async updatePassword(userId, oldPassword, newPassword) {
    try {
      logger.info(`Updating password for user: ${userId}`);

      const user = await dynamodbService.getItem(userId, 'userId');
      if (!user.success) {
        throw new Error('User not found');
      }

      // Verify old password
      if (!(await this._verifyPassword(oldPassword, user.data.password))) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password and update
      const hashedPassword = await this._hashPassword(newPassword);
      const result = await dynamodbService.updateItem(userId, {
        password: hashedPassword,
        updatedAt: new Date().toISOString(),
      }, 'userId');

      if (!result.success) {
        throw new Error('Failed to update password');
      }

      logger.info(`Password updated successfully for user: ${userId}`);
      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      logger.error(`Error updating password: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add product to user's products array
   * @param {string} userId - User ID
   * @param {string} productId - Product ID to add
   * @returns {Promise<Object>} Updated user object
   */
  static async addProduct(userId, productId) {
    try {
      logger.info(`Adding product ${productId} to user ${userId}`);

      const user = await dynamodbService.getItem(userId, 'userId');
      if (!user.success) {
        throw new Error('User not found');
      }

      const products = user.data.products || [];
      if (!products.includes(productId)) {
        products.push(productId);

        const result = await dynamodbService.updateItem(userId, {
          products: products,
          updatedAt: new Date().toISOString(),
        }, 'userId');

        logger.info(`Product added to user: ${userId}`);
        return this._omitPassword(result.data);
      }

      return this._omitPassword(user.data);
    } catch (error) {
      logger.error(`Error adding product to user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove product from user's products array
   * @param {string} userId - User ID
   * @param {string} productId - Product ID to remove
   * @returns {Promise<Object>} Updated user object
   */
  static async removeProduct(userId, productId) {
    try {
      logger.info(`Removing product ${productId} from user ${userId}`);

      const user = await dynamodbService.getItem(userId, 'userId');
      if (!user.success) {
        throw new Error('User not found');
      }

      const products = (user.data.products || []).filter(id => id !== productId);

      const result = await dynamodbService.updateItem(userId, {
        products: products,
        updatedAt: new Date().toISOString(),
      }, 'userId');

      logger.info(`Product removed from user: ${userId}`);
      return this._omitPassword(result.data);
    } catch (error) {
      logger.error(`Error removing product from user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete user
   * @param {string} id - User ID
   * @returns {Promise<Object>} Deletion response
   */
  static async deleteById(userId) {
    try {
      logger.info(`Deleting user: ${userId}`);

      const result = await dynamodbService.deleteItem(userId, 'userId');
      if (!result.success) {
        throw new Error('Failed to delete user');
      }

      logger.info(`User deleted successfully: ${userId}`);
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      logger.error(`Error deleting user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all users
   * @param {number} limit - Maximum number of users to return
   * @returns {Promise<Array>} Array of user objects
   */
  static async findAll(limit = 100) {
    try {
      logger.info('Fetching all users');

      const result = await dynamodbService.scan({ Limit: limit });
      if (!result.success) {
        throw new Error('Failed to fetch users');
      }

      return result.data.map(user => this._omitPassword(user));
    } catch (error) {
      logger.error(`Error fetching all users: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify user password
   * @param {string} email - User email
   * @param {string} password - Password to verify
   * @returns {Promise<Object|null>} User object if password is correct, null otherwise
   */
  static async verifyCredentials(email, password) {
    try {
      logger.info(`Verifying credentials for: ${email}`);

      const result = await dynamodbService.scan({
        FilterExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email,
        },
      });

      if (!result.success || result.data.length === 0) {
        logger.warn(`User not found: ${email}`);
        return null;
      }

      const user = result.data[0];
      const isPasswordValid = await this._verifyPassword(password, user.password);
      if (!isPasswordValid) {
        logger.warn(`Invalid password for user: ${email}`);
        return null;
      }

      logger.info(`Credentials verified for: ${email}`);
      return this._omitPassword(user);
    } catch (error) {
      logger.error(`Error verifying credentials: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get users by role
   * @param {string} role - User role
   * @returns {Promise<Array>} Array of users with specified role
   */
  static async findByRole(role) {
    try {
      logger.info(`Finding users by role: ${role}`);

      const result = await dynamodbService.scan({
        FilterExpression: 'role = :role',
        ExpressionAttributeValues: {
          ':role': role,
        },
      });

      if (!result.success) {
        throw new Error('Failed to fetch users by role');
      }

      return result.data.map(user => this._omitPassword(user));
    } catch (error) {
      logger.error(`Error finding users by role: ${error.message}`);
      throw error;
    }
  }

  /**
   * Helper: Hash password using bcrypt
   * @private
   * @param {string} password - Password to hash
   * @returns {Promise<string>} Hashed password
   */
  static async _hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(10);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      logger.error('Error hashing password:', error);
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Helper: Verify password using bcrypt
   * @private
   * @param {string} password - Password to verify
   * @param {string} hash - Password hash to compare against
   * @returns {Promise<boolean>} True if password matches
   */
  static async _verifyPassword(password, hash) {
    try {
      logger.info(`Verifying password - hash exists: ${!!hash}, hash type: ${typeof hash}`);
      
      if (!hash) {
        logger.error('No password hash provided for comparison');
        return false;
      }

      const isMatch = await bcrypt.compare(password, hash);
      logger.info(`Password comparison result: ${isMatch}`);
      return isMatch;
    } catch (error) {
      logger.error('Error verifying password:', error.message);
      logger.debug(`Hash value: ${hash}, Hash type: ${typeof hash}`);
      throw new Error('Password verification failed');
    }
  }

  /**
   * Helper: Generate username from name
   * @private
   * @param {string} name - User's name
   * @returns {string} Generated username
   */
  static _generateUsername(name) {
    return (
      name
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '') + '_' + Math.random().toString(36).substr(2, 5)
    );
  }

  /**
   * Helper: Remove password from user object
   * @private
   * @param {Object} user - User object
   * @returns {Object} User object without password
   */
  static _omitPassword(user) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

module.exports = User;
