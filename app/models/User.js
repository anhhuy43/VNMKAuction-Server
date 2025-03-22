const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-updater');
const moment = require("moment");

mongoose.plugin(slug);

const User = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true }, 
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }, 
  isActive: { type: Boolean, default: true }, 
  createdAt: { type: Date, default: Date.now }, 
  updatedAt: { type: Date, default: Date.now }, 
});

User.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

User.virtual("createAtFormatted").get(function () {
  return moment(this.createdAt).format("hh:mm A DD-MM-YYYY");
});

User.virtual("updateAtFormatted").get(function () {
  return moment(this.updatedAt).format("hh:mm A DD-MM-YYYY");
});

module.exports = mongoose.model('User', User);
