const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const { Op } = require('sequelize');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;

    // Validation
    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = await User.create({
      username,
      email,
      password_hash: password,
      full_name,
      auth_type: 'local',
      verification_token: verificationToken,
      email_verified: false // Set to true if you don't want email verification
    });

    // TODO: Send verification email
    // await emailService.sendVerificationEmail(user.email, verificationToken);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.user_id);

    res.status(201).json({
      message: 'Registration successful',
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        email_verified: user.email_verified
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    // Return more detailed error in development
    if (process.env.NODE_ENV === 'development') {
      return res.status(500).json({ 
        error: 'Registration failed',
        details: error.message,
        stack: error.stack
      });
    }
    
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login with username/password
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user by username or email
    // Optimize: Try username first (more specific), then email if not found
    // This allows PostgreSQL to use indexes more efficiently instead of OR queries
    let user = await User.findOne({
      where: {
        username,
        auth_type: 'local'
      },
      attributes: ['user_id', 'username', 'email', 'password_hash', 'full_name', 'profile_picture_url', 'email_verified']
    });

    // If not found by username, try email
    if (!user) {
      user = await User.findOne({
        where: {
          email: username,
          auth_type: 'local'
        },
        attributes: ['user_id', 'username', 'email', 'password_hash', 'full_name', 'profile_picture_url', 'email_verified']
      });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login (non-blocking, don't wait for it)
    user.update({ last_login_at: new Date() }).catch(err => {
      console.error('Error updating last_login_at:', err);
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.user_id);

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        profile_picture_url: user.profile_picture_url,
        email_verified: user.email_verified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Login error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    res.status(500).json({ error: 'Login failed' });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ 
      where: { 
        email,
        auth_type: 'local'
      } 
    });

    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await user.update({
      reset_token: resetToken,
      reset_token_expiry: resetTokenExpiry
    });

    // TODO: Send reset email
    // await emailService.sendPasswordResetEmail(user.email, resetToken);

    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = await User.findOne({
      where: {
        reset_token: token,
        reset_token_expiry: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Update password
    await user.update({
      password_hash: new_password,
      reset_token: null,
      reset_token_expiry: null
    });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

// Change password (for logged-in users)
exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = await User.findByPk(req.user.user_id);

    if (user.auth_type !== 'local') {
      return res.status(400).json({ error: 'Cannot change password for Google accounts' });
    }

    const isValid = await user.verifyPassword(current_password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    await user.update({ password_hash: new_password });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

// Google OAuth login (existing, keep as is)
exports.googleAuth = async (req, res) => {
  try {
    const { id_token } = req.body;

    if (!id_token) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const googleId = payload['sub'];
    const email = payload['email'];
    const fullName = payload['name'];
    const profilePicture = payload['picture'];

    let user = await User.findOne({ where: { google_id: googleId } });

    if (!user) {
      user = await User.create({
        google_id: googleId,
        email: email,
        full_name: fullName,
        profile_picture_url: profilePicture,
        auth_type: 'google',
        email_verified: true,
        last_login_at: new Date()
      });
    } else {
      await user.update({ last_login_at: new Date() });
    }

    const { accessToken, refreshToken } = generateTokens(user.user_id);

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        profile_picture_url: user.profile_picture_url
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Invalid Google token' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

    res.json({
      access_token: accessToken,
      refresh_token: newRefreshToken
    });
  } catch (error) {
    res.status(403).json({ error: 'Invalid refresh token' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id, {
      attributes: { exclude: ['google_id', 'password_hash', 'reset_token', 'verification_token'] }
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

