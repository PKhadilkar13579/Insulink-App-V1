'use strict';

const {
  sequelize,
  User,
  Role,
  Access,
  RoleAccessRelation,
  Site,
  Device,
  Channel,
  AlarmLog,
  AlarmAction,
  SystemConfig,
  SystemHealthLog,
  NotificationPreference
} = require("../models");

const authService = require("../services/auth.service");

exports.setupData = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    // ⚠️ Disable FK Checks for clean bootstrap
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });

    /* =====================================================
       1️⃣ CORE AUTH BOOTSTRAP (Users & Roles)
    ===================================================== */
    const hashedPassword = await authService.hashPassword("Admin@123");

    const [systemUser] = await User.findOrCreate({
      where: { email: "system@annunciator.com" },
      defaults: {
        name: "SYSTEM",
        email: "system@annunciator.com",
        contact: "0000000000",
        password: hashedPassword,
        role_id: 1, 
        account_status: "ACTIVE",
        created_by: "SYSTEM",
      },
      transaction,
    });

    const [superAdminRole] = await Role.findOrCreate({
      where: { role_name: "SuperAdmin" },
      defaults: { created_by: "SYSTEM" },
      transaction,
    });

    await systemUser.update({ role_id: superAdminRole.role_id }, { transaction });

    // Industrial Roles (SRS 1.2)
    const industrialRoles = ["Admin", "Operator", "Viewer"];
    const roleMap = { SuperAdmin: superAdminRole };

    for (const rName of industrialRoles) {
      const [role] = await Role.findOrCreate({
        where: { role_name: rName },
        defaults: { created_by: "SYSTEM" },
        transaction,
      });
      roleMap[rName] = role;
    }

    /* =====================================================
       2️⃣ ACCESS MODULES & PERMISSIONS (Merging Existing + New)
    ===================================================== */
    const accessModules = [
      // --- Your Existing Keys ---
      { code: "USER_MASTER", name: "User Management" },
      { code: "ROLE_MASTER", name: "Role Management" },
      { code: "ROLE_ACCESS", name: "Permissions Management" },
      { code: "ACCESS",      name: "Module Registration" },

      // --- New Industrial Keys ---
      { code: "ALARM_DASHBOARD", name: "Real-time Monitoring" },
      { code: "ALARM_ACTIONS",   name: "ACK/Reset/Mute Controls" },
      { code: "ALARM_HISTORY",   name: "Logs and Reports" },
      { code: "DEVICE_MASTER",   name: "Hardware & Channel Config" }
    ];

    for (const mod of accessModules) {
      const [access] = await Access.findOrCreate({
        where: { module_code: mod.code },
        defaults: { module_name: mod.name },
        transaction,
      });

      const accessId = access.access_id;

      // SuperAdmin & Admin: can_view=1, can_perform_action=1, can_edit=1
      await RoleAccessRelation.findOrCreate({
        where: { role_id: roleMap["Admin"].role_id, access_id: accessId },
        defaults: { can_view: true, can_perform_action: true, can_edit: true },
        transaction
      });

      // Operator: Can view and act, but not edit config
      if (["ALARM_DASHBOARD", "ALARM_ACTIONS", "ALARM_HISTORY"].includes(mod.code)) {
        await RoleAccessRelation.findOrCreate({
          where: { role_id: roleMap["Operator"].role_id, access_id: accessId },
          defaults: { can_view: true, can_perform_action: true, can_edit: false },
          transaction
        });
      }

      // Viewer: Read-only
      if (["ALARM_DASHBOARD", "ALARM_HISTORY"].includes(mod.code)) {
        await RoleAccessRelation.findOrCreate({
          where: { role_id: roleMap["Viewer"].role_id, access_id: accessId },
          defaults: { can_view: true, can_perform_action: false, can_edit: false },
          transaction
        });
      }
    }

    /* =====================================================
       3️⃣ INDUSTRIAL INFRASTRUCTURE (Site > Device > 72 Channels)
    ===================================================== */
    const [site] = await Site.findOrCreate({
      where: { site_name: "Pune Central Substation" },
      defaults: { location: "Shivajinagar", status: "ACTIVE", created_by: "SYSTEM" },
      transaction
    });

    const [device] = await Device.findOrCreate({
      where: { hardware_uid: "DEV-HW-72CH-001" },
      defaults: {
        site_id: site.site_id,
        device_name: "Annunciator Panel A1",
        connection_status: "ONLINE",
        power_source: "AC"
      },
      transaction
    });

    // Bulk Create 72 Channels
    const channelsCount = await Channel.count({ where: { device_id: device.device_id }, transaction });
    if (channelsCount === 0) {
      const channels = Array.from({ length: 72 }, (_, i) => ({
        device_id: device.device_id,
        channel_number: i + 1,
        label: `Feeder Line ${i + 1}`,
        priority: (i + 1) <= 10 ? 'CRITICAL' : 'WARNING',
        input_type: 'NO'
      }));
      await Channel.bulkCreate(channels, { transaction });
    }

    /* =====================================================
       4️⃣ SEEDING OPERATIONAL DATA (Ensure No Table is Empty)
    ===================================================== */
    
    // A. Create Demo Users
    const [opUser] = await User.findOrCreate({
      where: { email: "operator@demo.com" },
      defaults: { name: "Operator Rajesh", email: "operator@demo.com", contact: "9876543210", password: hashedPassword, role_id: roleMap["Operator"].role_id, user_type: "CLIENT" },
      transaction
    });

    // B. Create Default Config
    await SystemConfig.findOrCreate({
      where: { device_id: device.device_id },
      defaults: { hooter_timeout_seconds: 60, heartbeat_interval_seconds: 30, updated_by: systemUser.user_id },
      transaction
    });

    // C. Create Initial Health Log
    await SystemHealthLog.create({
      device_id: device.device_id,
      power_source: 'AC_MAINS',
      battery_voltage: 13.8,
      battery_percentage: 100,
      signal_strength: -65,
      connection_type: 'GSM',
      internal_temp_c: 32.5,
      free_ram_mb: 1024,
      uptime_seconds: 3600
    }, { transaction });

    // D. Create a sample Alarm Log
    const sampleChannel = await Channel.findOne({ where: { device_id: device.device_id, channel_number: 1 }, transaction });
    const [alarm] = await AlarmLog.findOrCreate({
      where: { channel_id: sampleChannel.channel_id, status: 'ACKNOWLEDGED' },
      defaults: {
        severity: 'CRITICAL',
        fault_at: new Date(Date.now() - 3600000), // 1 hour ago
        acknowledged_at: new Date(),
        acknowledged_by: opUser.user_id,
        alarm_message: "High Voltage Trip on Feeder 1"
      },
      transaction
    });

    // E. Create a sample Alarm Action (Audit Trail)
    await AlarmAction.create({
      alarm_log_id: alarm.alarm_id,
      user_id: opUser.user_id,
      action_type: 'ACKNOWLEDGE',
      remarks: 'Inspected and acknowledged',
      source: 'Mobile App'
    }, { transaction });

    // F. Create Notification Preferences
    await NotificationPreference.findOrCreate({
      where: { user_id: opUser.user_id, site_id: site.site_id },
      defaults: { push_enabled: true, sound_enabled: true, vibration_enabled: true, min_severity_level: 'INFO' },
      transaction
    });

    /* =====================================================
       🔒 RE-ENABLE FK CHECKS & FINALIZE
    ===================================================== */
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "✅ Setup complete. All 12 tables initialized with industrial data.",
      data: {
        site: site.site_name,
        device: device.device_name,
        channels: 72,
        access_modules: accessModules.length
      }
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Setup Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};