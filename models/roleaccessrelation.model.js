'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RoleAccessRelation extends Model {
    static associate(models) {
      RoleAccessRelation.belongsTo(models.Role, {
        foreignKey: 'role_id',
        as: 'role',
        onDelete: 'CASCADE'
      });

      RoleAccessRelation.belongsTo(models.Access, {
        foreignKey: 'access_id',
        as: 'access',
        onDelete: 'CASCADE'
      });
    }
  }

  RoleAccessRelation.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      access_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      can_view: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      can_perform_action: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      can_edit: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    },
    {
      sequelize,
      modelName: 'RoleAccessRelation',
      tableName: 'role_access_relation',
      timestamps: false,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['role_id', 'access_id']
        }
      ]
    }
  );

  return RoleAccessRelation;
};