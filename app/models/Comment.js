const mongoose = require("mongoose");
const moment = require("moment");

const Comment = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  contentBid: { type: Number, required: true, min: 1 },
  createAt: { type: Date, default: Date.now },
});

Comment.virtual("createAtFormatted").get(function () {
  return moment(this.createAt).format("hh:mm A DD-MM-YYYY");
});

module.exports = mongoose.model("Comment", Comment);
