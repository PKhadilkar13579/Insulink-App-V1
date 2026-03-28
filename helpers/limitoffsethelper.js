LimitOffsetHelper = function() {
    this.obj = {}
}

LimitOffsetHelper.prototype.clause = function(offset, limit) {

  if(offset){
    this.obj[offset] = parseInt(offset)
  }
  else {
    this.obj[offset] = 0;
  }

  if(limit){
    this.obj[limit] = parseInt(limit)
  }
  else {
    this.obj[limit] = 100;
  }

  return this;
}

LimitOffsetHelper.prototype.toJSON = function() {
  return this.obj
}

module.exports = LimitOffsetHelper;