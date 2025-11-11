'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('documents', {
      document_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'product_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      document_type: {
        type: Sequelize.ENUM('receipt', 'warranty_card', 'invoice', 'manual', 'other'),
        defaultValue: 'receipt',
        allowNull: false
      },
      cloud_storage_url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      file_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      mime_type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      thumbnail_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      ocr_data: {
        type: Sequelize.JSON,
        allowNull: true
      },
      ocr_raw_text: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      ocr_processed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      upload_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes
    await queryInterface.addIndex('documents', ['product_id'], {
      name: 'idx_documents_product_id'
    });
    await queryInterface.addIndex('documents', ['document_type'], {
      name: 'idx_documents_type'
    });
    await queryInterface.addIndex('documents', ['is_primary'], {
      name: 'idx_documents_is_primary'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('documents');
  }
};

