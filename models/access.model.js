'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Access extends Model {
    static associate(models) {
      Access.hasMany(models.RoleAccessRelation, {
        foreignKey: 'access_id',
        as: 'role_relations' // Updated alias for clarity
      });
    }
  }

  Access.init(
    {
      access_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      // E.g., 'ALARM_MGMT', 'USER_MGMT'
      module_code: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
      },
      // Human readable name
      module_name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      // Industrial Context: Explains what permissions this module covers
      description: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'Access',
      tableName: 'access',
      timestamps: false,
      underscored: true
    }
  );

  return Access;
}