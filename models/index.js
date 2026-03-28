const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const dbConfig = require("../config/db.config.js");
const db = {};

const sequelize = new Sequelize(
  dbConfig.DB,
  dbConfig.USER,
  dbConfig.PASSWORD,
  {
    host: dbConfig.HOST,
    port: dbConfig.PORT,
    dialect: dbConfig.dialect,
    pool: {
      max: dbConfig.pool.max,
      min: dbConfig.pool.min,
      acquire: dbConfig.pool.acquire,
      idle: dbConfig.pool.idle
    },
    dialectOptions: {
      connectTimeout: dbConfig.dialectOptions.connectTimeout
    }
  }
);

fs.readdirSync(__dirname)
  .filter(file => 
    file.indexOf('.') !== 0 && 
    file !== basename && 
    file.slice(-3) === '.js'
  )
  .forEach(file => {
    const modelDef = require(path.join(__dirname, file));
    
    // FIX: Check if the exported value is a function before calling it
    if (typeof modelDef === 'function') {
      const model = modelDef(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
    } else {
      console.error(`Error in ${file}: Model file must export a function (sequelize, DataTypes) => { ... }`);
    }
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;