const { Family, FamilyMember, User, SharedProduct, Product, Store, Category, Document } = require('../models');
const crypto = require('crypto');
const { Op } = require('sequelize');

// Generate unique invite code
const generateInviteCode = () => {
  return crypto.randomBytes(5).toString('hex').toUpperCase();
};

// Create family
exports.createFamily = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Family name is required' });
    }

    // Check if user already owns a family
    const existingFamily = await Family.findOne({
      where: { owner_id: req.user.user_id }
    });

    if (existingFamily) {
      return res.status(400).json({ error: 'You already own a family' });
    }

    // Generate unique invite code
    let inviteCode;
    let isUnique = false;
    while (!isUnique) {
      inviteCode = generateInviteCode();
      const existing = await Family.findOne({ where: { invite_code: inviteCode } });
      if (!existing) isUnique = true;
    }

    // Create family
    const family = await Family.create({
      name,
      owner_id: req.user.user_id,
      invite_code: inviteCode
    });

    // Add owner as member
    await FamilyMember.create({
      family_id: family.family_id,
      user_id: req.user.user_id,
      role: 'owner'
    });

    res.status(201).json({
      message: 'Family created successfully',
      family: {
        family_id: family.family_id,
        name: family.name,
        invite_code: family.invite_code,
        owner_id: family.owner_id
      }
    });
  } catch (error) {
    console.error('Create family error:', error);
    res.status(500).json({ error: 'Failed to create family' });
  }
};

// Get user's family
exports.getFamily = async (req, res) => {
  try {
    const familyMember = await FamilyMember.findOne({
      where: { user_id: req.user.user_id },
      include: [
        {
          model: Family,
          include: [
            { model: User, as: 'Owner', attributes: ['user_id', 'full_name', 'email'] }
          ]
        }
      ]
    });

    if (!familyMember) {
      return res.json({ family: null });
    }

    // Get all members
    const members = await FamilyMember.findAll({
      where: { family_id: familyMember.Family.family_id },
      include: [
        { model: User, attributes: ['user_id', 'full_name', 'email', 'profile_picture_url'] }
      ],
      order: [['joined_at', 'ASC']]
    });

    res.json({
      family: {
        ...familyMember.Family.toJSON(),
        role: familyMember.role,
        members: members.map(m => ({
          member_id: m.member_id,
          user_id: m.User.user_id,
          full_name: m.User.full_name,
          email: m.User.email,
          profile_picture_url: m.User.profile_picture_url,
          role: m.role,
          joined_at: m.joined_at
        }))
      }
    });
  } catch (error) {
    console.error('Get family error:', error);
    res.status(500).json({ error: 'Failed to get family' });
  }
};

// Join family with invite code
exports.joinFamily = async (req, res) => {
  try {
    const { invite_code } = req.body;

    if (!invite_code) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    // Find family
    const family = await Family.findOne({
      where: { invite_code: invite_code.toUpperCase() }
    });

    if (!family) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    // Check if already a member
    const existingMember = await FamilyMember.findOne({
      where: {
        user_id: req.user.user_id,
        family_id: family.family_id
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'You are already a member of this family' });
    }

    // Check if user is in another family
    const otherFamilyMember = await FamilyMember.findOne({
      where: { user_id: req.user.user_id }
    });

    if (otherFamilyMember) {
      return res.status(400).json({ error: 'You are already in another family. Please leave it first.' });
    }

    // Check member limit
    const memberCount = await FamilyMember.count({
      where: { family_id: family.family_id }
    });

    if (memberCount >= family.max_members) {
      return res.status(400).json({ error: 'Family has reached maximum member limit' });
    }

    // Add member
    await FamilyMember.create({
      family_id: family.family_id,
      user_id: req.user.user_id,
      role: 'member'
    });

    res.json({
      message: 'Successfully joined family',
      family: {
        family_id: family.family_id,
        name: family.name
      }
    });
  } catch (error) {
    console.error('Join family error:', error);
    res.status(500).json({ error: 'Failed to join family' });
  }
};

// Leave family
exports.leaveFamily = async (req, res) => {
  try {
    const familyMember = await FamilyMember.findOne({
      where: { user_id: req.user.user_id }
    });

    if (!familyMember) {
      return res.status(404).json({ error: 'You are not in any family' });
    }

    if (familyMember.role === 'owner') {
      return res.status(400).json({ error: 'Owner cannot leave family. Delete the family instead.' });
    }

    // Remove all shared products by this user
    await SharedProduct.destroy({
      where: {
        family_id: familyMember.family_id,
        shared_by: req.user.user_id
      }
    });

    // Remove member
    await familyMember.destroy();

    res.json({ message: 'Successfully left family' });
  } catch (error) {
    console.error('Leave family error:', error);
    res.status(500).json({ error: 'Failed to leave family' });
  }
};

// Delete family (owner only)
exports.deleteFamily = async (req, res) => {
  try {
    const family = await Family.findOne({
      where: { owner_id: req.user.user_id }
    });

    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }

    // Delete all shared products
    await SharedProduct.destroy({
      where: { family_id: family.family_id }
    });

    // Delete all members
    await FamilyMember.destroy({
      where: { family_id: family.family_id }
    });

    // Delete family
    await family.destroy();

    res.json({ message: 'Family deleted successfully' });
  } catch (error) {
    console.error('Delete family error:', error);
    res.status(500).json({ error: 'Failed to delete family' });
  }
};

// Share product with family
exports.shareProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user owns the product
    const product = await Product.findOne({
      where: {
        product_id: id,
        user_id: req.user.user_id
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user is in a family
    const familyMember = await FamilyMember.findOne({
      where: { user_id: req.user.user_id }
    });

    if (!familyMember) {
      return res.status(400).json({ error: 'You are not in any family' });
    }

    // Check if already shared
    const existingShare = await SharedProduct.findOne({
      where: {
        product_id: id,
        family_id: familyMember.family_id
      }
    });

    if (existingShare) {
      return res.status(400).json({ error: 'Product is already shared with family' });
    }

    // Share product
    await SharedProduct.create({
      product_id: id,
      family_id: familyMember.family_id,
      shared_by: req.user.user_id
    });

    res.json({ message: 'Product shared successfully' });
  } catch (error) {
    console.error('Share product error:', error);
    res.status(500).json({ error: 'Failed to share product' });
  }
};

// Unshare product
exports.unshareProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const sharedProduct = await SharedProduct.findOne({
      where: {
        product_id: id,
        shared_by: req.user.user_id
      }
    });

    if (!sharedProduct) {
      return res.status(404).json({ error: 'Shared product not found' });
    }

    await sharedProduct.destroy();

    res.json({ message: 'Product unshared successfully' });
  } catch (error) {
    console.error('Unshare product error:', error);
    res.status(500).json({ error: 'Failed to unshare product' });
  }
};

// Get shared products
exports.getSharedProducts = async (req, res) => {
  try {
    const familyMember = await FamilyMember.findOne({
      where: { user_id: req.user.user_id }
    });

    if (!familyMember) {
      return res.json({ products: [] });
    }

    const sharedProducts = await SharedProduct.findAll({
      where: { family_id: familyMember.family_id },
      include: [
        {
          model: Product,
          include: [
            { model: Store },
            { model: Category },
            { 
              model: Document,
              where: { is_primary: true },
              required: false
            },
            { model: User, attributes: ['user_id', 'full_name'] }
          ]
        },
        { model: User, as: 'Sharer', attributes: ['user_id', 'full_name'] }
      ],
      order: [['shared_at', 'DESC']]
    });

    res.json({
      products: sharedProducts.map(sp => ({
        ...sp.Product.toJSON(),
        shared_by: sp.Sharer.full_name,
        shared_at: sp.shared_at
      }))
    });
  } catch (error) {
    console.error('Get shared products error:', error);
    res.status(500).json({ error: 'Failed to get shared products' });
  }
};

// Remove member (owner/admin only)
exports.removeMember = async (req, res) => {
  try {
    const { member_id } = req.params;

    const familyMember = await FamilyMember.findOne({
      where: { user_id: req.user.user_id }
    });

    if (!familyMember || (familyMember.role !== 'owner' && familyMember.role !== 'admin')) {
      return res.status(403).json({ error: 'Only owner or admin can remove members' });
    }

    const memberToRemove = await FamilyMember.findOne({
      where: {
        member_id,
        family_id: familyMember.family_id
      }
    });

    if (!memberToRemove) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (memberToRemove.role === 'owner') {
      return res.status(400).json({ error: 'Cannot remove family owner' });
    }

    // Remove shared products by this member
    await SharedProduct.destroy({
      where: {
        family_id: familyMember.family_id,
        shared_by: memberToRemove.user_id
      }
    });

    await memberToRemove.destroy();

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
};

