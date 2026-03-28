'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SystemHealthLog extends Model {
    static associate(models) {
      // Each health snapshot belongs to one physical device
      SystemHealthLog.belongsTo(models.Device, {
        foreignKey: 'device_id',
        as: 'device',
        onDelete: 'CASCADE'
      });
    }
  }

  SystemHealthLog.init(
    {
      log_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      device_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      power_source: {
        type: DataTypes.ENUM('AC_MAINS', 'BATTERY_BACKUP'),
        allowNull: false
      },
      battery_voltage: {
        type: DataTypes.FLOAT,
        comment: 'Actual voltage for precise health monitoring'
      },
      battery_percentage: {
        type: DataTypes.INTEGER,
        validate: { min: 0, max: 100 }
      },
      signal_strength: {
        type: DataTypes.INTEGER,
        comment: 'GSM Signal strength in dBm or RSSI'
      },
      connection_type: {
        type: DataTypes.ENUM('GSM', 'ETHERNET', 'WIFI'),
        allowNull: false
      },
      internal_temp_c: {
        type: DataTypes.FLOAT,
        comment: 'Monitoring for 0°C to 70°C operating range'
      },
      free_ram_mb: {
        type: DataTypes.INTEGER,
        comment: 'Monitoring 2GB+ RAM usage (PRD 12.13)'
      },
      uptime_seconds: {
        type: DataTypes.BIGINT,
        comment: 'Time since last hardware reboot'
      }
    },
    {
      sequelize,
      modelName: 'SystemHealthLog',
      tableName: 'system_health_logs',
      timestamps: true,
      updatedAt: false, 
      createdAt: 'timestamp',
      underscored: true,
      indexes: [
        { fields: ['device_id'] },
        { fields: ['timestamp'] }
      ]
    }
  );

  return SystemHealthLog;
};