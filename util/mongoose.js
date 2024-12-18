module.exports = {
  multipleMongooseToObject: function (mongooseArr) {
    return mongooseArr.map(mongooseArrItem => mongooseArrItem.toObject())
  },
  mongooseToObject: function (mongooseObj) {
    return mongooseObj ? mongooseObj.toObject() : mongooseObj
  }
}