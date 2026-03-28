WhereBuilder = function() {
    this.obj = {}
}

WhereBuilder.prototype.clause = function(key, value) {
  if (value) {
    this.obj[key] = value
  }

  return this;
}

WhereBuilder.prototype.toJSON = function() {
  return this.obj
}

module.exports = WhereBuilder;