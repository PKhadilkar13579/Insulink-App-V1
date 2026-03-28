'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AlarmLog extends Model {
    static associate(models) {
      // PRD 12.4: Each log entry belongs to a specific input channel
      AlarmLog.belongsTo(models.Channel, {
        foreignKey: 'channel_id',
        as: 'channel'
      });

      // PRD 12.5: Track which user acknowledged the alarm
      AlarmLog.belongsTo(models.User, {
        foreignKey: 'acknowledged_by',
        as: 'ack_user'
      });

      // Track which user performed the final reset
      AlarmLog.belongsTo(models.User, {
        foreignKey: 'reset_by',
        as: 'reset_user'
      });
    }
  }

  AlarmLog.init(
    {
      alarm_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      channel_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      // PRD 12.4: Statuses for the Dashboard logic
      status: {
        type: DataTypes.ENUM('ACTIVE', 'ACKNOWLEDGED', 'CLEARED', 'RESET'),
        defaultValue: 'ACTIVE',
        comment: 'ACTIVE = Unacknowledged fault, CLEARED = Normal but needs reset'
      },
      // PRD 12.4: Severity at the time of the fault (captured from Channel priority)
      severity: {
        type: DataTypes.ENUM('CRITICAL', 'WARNING', 'INFO'),
        allowNull: false
      },
      // PRD 12.6: Detailed Timestamps for filtering and history
      fault_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'When the fault was first detected'
      },
      acknowledged_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      acknowledged_by: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      cleared_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the physical fault condition actually stopped'
      },
      reset_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      reset_by: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      // PRD 12.3: Log the specific message sent in notifications
      alarm_message: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'AlarmLog',
      tableName: 'alarm_logs',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['status'] },
        { fields: ['fault_at'] },
        { fields: ['channel_id'] }
      ]
    }
  );

  return AlarmLog;
};