const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const slug = require("mongoose-slug-updater");
const moment = require("moment");

mongoose.plugin(slug);

const Post = new Schema({
  name: { type: String, maxLength: 255 },
  description: { type: String, maxLength: 600 },
  images: { type: [String], default: [] },
  startTime: { type: Date },
  endTime: { type: Date },
  slug: { type: String, slug: "name", unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isBlurred: { type: Boolean, default: false },
  feedback: { type: String, default: null },
  isDeleted: { type: Boolean, default: false },
  startingPrice: { type: Number, required: true },
});

// Virtual: Định dạng thời gian `createAt`
Post.virtual("createAtFormatted").get(function () {
  return moment(this.createAt).format("hh:mm A DD-MM-YYYY");
});

// Virtual: URL đầy đủ cho ảnh
Post.virtual("fullImages").get(function () {
  return this.images.map((image) => {
    const baseURL = process.env.BASE_URL || "http://localhost:5000";
    return `${baseURL}${image}`;
  });
});

// Kích hoạt virtuals khi gọi `toObject` hoặc `toJSON`
Post.set("toObject", { virtuals: true });
Post.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Post", Post);
