const db = require("../models");
const Op = db.Sequelize.Op;

LikeQueryHelper = function () {
  this.obj = {}
}

LikeQueryHelper.prototype.clause = function (value, key) {
  if (value) {
    this.obj[key] = {
      [Op.like]: '%' + value + '%'
    };
  }
  return this;
}

LikeQueryHelper.prototype.toJSON = function () {
  return this.obj
}

module.exports = LikeQueryHelper;