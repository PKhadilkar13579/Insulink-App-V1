const db = require("../models");

module.exports = async () => {
  try {
    await db.sequelize.sync({alter:true});
    console.log("✅ Database synced with alter: true");
  } catch (err) {
    console.error("❌ DB sync failed:", err);
  }

  try {
    const DBGroupByQuery = "SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''));"
    await db.sequelize.query(DBGroupByQuery);

    setInterval(async () => {
      await db.sequelize.query(DBGroupByQuery, { type: db.sequelize.QueryTypes.UPDATE })
    }, 60000);
  } catch (_) { }
};
