const Post = require("../models/Post");
const Comment = require("../models/Comment");
const User = require("../models/User");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
const utc = require("dayjs/plugin/utc");
const jwt = require("jsonwebtoken");
const timezone = require("dayjs/plugin/timezone");
const bcrypt = require("bcrypt");
dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(timezone);

class PostController {
  // [GET] /api/posts
  async getListPosts(req, res, next) {
    try {
      const posts = await Post.find({ isDeleted: false })
        .populate("userId", "firstName lastName email")
        .exec();
      res.status(200).json({
        success: true,
        data: posts,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách bài viết",
      });
    }
  }

  async login(req, res, next) {
    try {
      const user = await User.findOne({ email: req.body.email });
      console.log("🚀 ~ PostController ~ login ~ user:", user)
      if (!user) {
        return res.status(404).json({ message: "Admin Account Not Found" });
      }
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Access denied: Not an admin" });
      }
      const isPasswordMatch = await bcrypt.compare(
        req.body.password,
        user.password
      );
      if (isPasswordMatch) {
        const token = jwt.sign(
          { id: user._id, role: user.role },
          process.env.JWT_SECRET_KEY
        );

        return res.status(200).json({
          success: true,
          message: "Login Successful",
          token,
          role: user.role,
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "Wrong Password",
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
}

module.exports = new PostController();
