const { exec } = require('child_process');
const path = require('path');
const mysql = require('mysql2/promise');

/**
 * Full backup, import, and cleanup process with skip options.
 */
async function runBackupAndCleanup(config) {
  const { sourceDb, targetDb, user, password, host, mysqldumpPath, mysqlPath, backupFileName, dateField, olderThanDays, excludedTables, runExport, runDropTables, runImport, runCleanup } = config;

  const backupFile = path.resolve(__dirname, backupFileName);

  if (!runExport) {
    console.log('⏭️ Export skipped.');
    proceedAfterExport();
    return;
  }

  const exportCmd = `${mysqldumpPath} --add-drop-table -h ${host} -u ${user} -p${password} ${sourceDb} > "${backupFile}"`;
  exec(exportCmd, (err) => {
    if (err) {
      console.error('❌ Export error:', err.message);
      return;
    }
    console.log('✅ Export completed.');
    proceedAfterExport();
  });

  function proceedAfterExport() {
    if (!runDropTables) {
      console.log('⏭️ Drop tables skipped.');
      proceedAfterDrop();
      return;
    }

    dropAllTables({ dbName: targetDb, user, password, host }).then(dropSuccess => {
      if (!dropSuccess) {
        console.error('❌ Dropping tables failed. Aborting import.');
        return;
      }
      proceedAfterDrop();
    });
  }

  function proceedAfterDrop() {
    if (!runImport) {
      console.log('⏭️ Import skipped.');
      proceedAfterImport();
      return;
    }

    const importCmd = `${mysqlPath} -h ${host} -u ${user} -p${password} ${targetDb} < "${backupFile}"`;
    exec(importCmd, (err) => {
      if (err) {
        console.error('❌ Import error:', err.message);
        return;
      }
      console.log('✅ Import completed.');
      proceedAfterImport();
    });
  }

  function proceedAfterImport() {
    if (!runCleanup) {
      console.log('⏭️ Cleanup skipped.');
      return;
    }

    cleanOldData({
      dbName: sourceDb,
      user,
      password,
      host,
      dateField,
      olderThanDays,
      excludedTables
    });
  }
}

async function dropAllTables({ dbName, user, password, host }) {
  const connection = await mysql.createConnection({
    host,
    user,
    password,
    database: dbName,
    multipleStatements: true
  });

  try {
    const [rows] = await connection.query(`
      SELECT table_name AS tableName
      FROM information_schema.tables
      WHERE table_schema = ?
    `, [dbName]);

    if (rows.length === 0) {
      console.log('ℹ️ No tables to drop.');
      await connection.end();
      return true;
    }

    const dropQueries = rows.map(r => `DROP TABLE IF EXISTS \`${r.tableName}\`;`).join(' ');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query(dropQueries);
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log(`✅ Dropped ${rows.length} table(s) from "${dbName}".`);
    await connection.end();
    return true;
  } catch (err) {
    console.error('❌ Error dropping tables:', err.message);
    await connection.end();
    return false;
  }
}

async function cleanOldData({ dbName, user, password, host, dateField, olderThanDays, excludedTables }) {
  const connection = await mysql.createConnection({
    host,
    user,
    password,
    database: dbName,
    multipleStatements: true
  });

  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - olderThanDays);
  const formattedDate = dateThreshold.toISOString().split('T')[0];

  try {
    const [tables] = await connection.query(`
      SELECT table_name AS tableName
      FROM information_schema.tables
      WHERE table_schema = ?
    `, [dbName]);

    for (const row of tables) {
      const tableName = row.tableName;
      if (!tableName || excludedTables.includes(tableName)) continue;

      try {
        const [columns] = await connection.query(`
          SHOW COLUMNS FROM \`${tableName}\` LIKE ?
        `, [dateField]);

        if (columns.length > 0) {
          await connection.query(`SET FOREIGN_KEY_CHECKS = 0`);
          const [result] = await connection.query(`
            DELETE FROM \`${tableName}\`
            WHERE DATE(\`${dateField}\`) < ?
          `, [formattedDate]);
          await connection.query(`SET FOREIGN_KEY_CHECKS = 1`);

          console.log(`🗑️ Cleaned ${result.affectedRows} rows from "${tableName}"`);
        } else {
          console.log(`⏭️ Skipped "${tableName}" (no ${dateField} column)`);
        }
      } catch (err) {
        console.warn(`⚠️ Error cleaning table "${tableName}":`, err.message);
      }
    }
  } catch (err) {
    console.error('❌ Cleanup error:', err.message);
  } finally {
    await connection.end();
  }
}

module.exports = { runBackupAndCleanup };
