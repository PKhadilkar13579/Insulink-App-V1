'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Site extends Model {
    static associate(models) {
      // PRD 12.8: A site can have multiple annunciator devices
      Site.hasMany(models.Device, {
        foreignKey: 'site_id',
        as: 'devices',
        onDelete: 'RESTRICT'
      });
    }
  }

  Site.init(
    {
      site_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      // PRD 12.6: Name used for filtering and display
      site_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
      },
      // Physical location or address of the substation
      location: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      // Status to enable/disable monitoring for an entire site
      status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
        defaultValue: 'ACTIVE',
        allowNull: false
      },
      // Tracking for Section 12.7 (Admin changes)
      created_by: {
        type: DataTypes.STRING,
        allowNull: true
      },
      updated_by: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'Site',
      tableName: 'sites',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  return Site;
};