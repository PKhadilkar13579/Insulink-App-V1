'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SystemConfig extends Model {
    static associate(models) {
      // Configuration can be global (null device_id) or specific to one panel
      SystemConfig.belongsTo(models.Device, {
        foreignKey: 'device_id',
        as: 'device',
        onDelete: 'CASCADE'
      });
    }
  }

  SystemConfig.init(
    {
      config_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      device_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'If null, this is a global system-wide configuration'
      },
      // PRD 10.2 & 11.2: Logic for the hooter/buzzer
      hooter_timeout_seconds: {
        type: DataTypes.INTEGER,
        defaultValue: 60,
        comment: 'Auto-silence hooter after X seconds'
      },
      // PRD 12.9: Connectivity and Sync frequency
      heartbeat_interval_seconds: {
        type: DataTypes.INTEGER,
        defaultValue: 30,
        comment: 'Frequency at which hardware pings the server'
      },
      offline_threshold_seconds: {
        type: DataTypes.INTEGER,
        defaultValue: 90,
        comment: 'Time after which a device is flagged as OFFLINE'
      },
      // PRD 10.2: 4G GSM and SMS Alert settings
      sms_gateway_api_key: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      emergency_contact_mobile: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Primary number for critical system-fail alerts'
      },
      // PRD 12.10: Factory Settings vs Admin configurable
      is_factory_locked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'If true, even Admins cannot change these via the App'
      },
      // PRD 12.7: All changes tracked with user ID and timestamp
      updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'User ID of the Admin who last changed settings'
      }
    },
    {
      sequelize,
      modelName: 'SystemConfig',
      tableName: 'system_configs',
      timestamps: true,
      underscored: true
    }
  );

  return SystemConfig;
};