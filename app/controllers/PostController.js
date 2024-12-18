const Post = require("../models/Post");
const Comment = require("../models/Comment");
const User = require("../models/User");
const { mongooseToObject } = require("../../util/mongoose");
const { multipleMongooseToObject } = require("../../util/mongoose");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
const utc = require("dayjs/plugin/utc");
const jwt = require("jsonwebtoken");
const timezone = require("dayjs/plugin/timezone");
const authConstant = require("../../constants/authConstant");
const { getSocketIO } = require("../../socket");
dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(timezone);

class PostController {
  // [GET] /api/posts
  async listPosts(req, res, next) {
    try {
      const posts = await Post.find({ isDeleted: false })
        .populate("userId", "firstName lastName email")
        .exec();

      const postsWithFullImagePath = posts.map((post) => {
        const images = post.images.map(
          (image) => `${req.protocol}://${req.get("host")}${image}`
        );

        return {
          ...post.toObject(),
          images,
          user: post.userId, // Thông tin người đăng (name, email)
        };
      });

      res.json(postsWithFullImagePath);
    } catch (error) {
      next(error);
    }
  }

  async myPosts(req, res, next) {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({ message: "Token Not Found" });
      }

      const decode = jwt.decode(token, authConstant.JWT_SECRET_KEY);

      const myListPosts = await Post.find({
        userId: decode.userId,
        isDeleted: false,
      });
      res.status(200).json({
        myListPosts,
      });
    } catch (error) {
      next(error);
    }
  }

  async postDetail(req, res, next) {
    try {
      const postId = req.params.id;
      console.log("🚀 ~ PostController ~ postDetail ~ postId:", postId);

      // Tìm bài post trong database
      const post = await Post.findOne({ _id: postId, isDeleted: false })
        .populate("userId", "firstName lastName email")
        .exec();

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const images = post.images.map(
        (image) => `${req.protocol}://${req.get("host")}${image}`
      );

      // Lấy danh sách comment liên quan đến bài post
      const comments = await Comment.find({ postId }).sort({ createAt: -1 });

      // Tìm bid cao nhất (nếu có comment)
      let highestBid = null;
      let highestBidder = null;

      if (comments.length > 0) {
        const sortedBids = comments
          .filter((comment) => !isNaN(comment.contentBid)) // Chỉ lấy những comment có giá trị bid hợp lệ
          .sort((a, b) => b.contentBid - a.contentBid); // Sắp xếp giảm dần theo contentBid

        if (sortedBids.length > 0) {
          highestBid = sortedBids[0].contentBid; // Giá trị bid cao nhất
          highestBidder = await User.findOne({ _id: sortedBids[0].userId }); // Lấy thông tin người bid cao nhất
        }
      }

      // Định dạng lại comment kèm thông tin user
      const commentsWithUser = await Promise.all(
        comments.map(async (comment) => {
          const user = await User.findOne(
            { _id: comment.userId },
            "firstName lastName"
          ); // Lấy thông tin user
          return {
            ...comment.toObject(),
            user: user ? user.toObject() : null,
          };
        })
      );

      // Trả dữ liệu về frontend
      res.status(200).json({
        post: { ...post.toObject(), images, endTime: post.endTime },
        comments: commentsWithUser,
        highestBid: highestBid, // Giá trị bid cao nhất
        highestBidder: highestBidder ? highestBidder.toObject() : null, // Thông tin người bid cao nhất
      });
    } catch (error) {
      console.error("Error fetching post details:", error);
      res.status(500).json({ message: "Error fetching post details" });
    }
  }

  async createPost(req, res, next) {
    console.log("file", req.files);
    try {
      const { name, description, startTime, endTime, startingPrice } = req.body;
      const token = req.headers.authorization?.split(" ")[1];
      const decode = jwt.decode(token, authConstant.JWT_SECRET_KEY);

      if (!startingPrice || isNaN(startingPrice) || startingPrice < 0) {
        return res.status(400).json({
          message: "Starting price is required and must be a positive number.",
        });
      }

      const uploadedImages = req.files?.map((file) => {
        return `/uploads/${file.filename}`;
      });

      const newPost = new Post({
        name,
        description,
        images: uploadedImages,
        startTime: new Date(startTime), // ISO string thành Date object
        endTime: new Date(endTime),
        startingPrice: parseFloat(startingPrice),
        userId: decode.userId,
      });

      await newPost.save();

      res.status(201).json({
        message: "Post created successfully!",
        post: newPost,
      });
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({
        message: "Failed to create post.",
        error: error.message,
      });
    }
  }

  // [GET] /api/posts/:id/comments
  async getComments(req, res, next) {
    try {
      const { id: postId } = req.params; // Lấy ID bài post từ URL
      const comments = await Comment.find({ postId }).sort({ createAt: -1 }); // Lấy comment và sắp xếp mới nhất trước
      res.status(200).json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Error fetching comments" });
    }
  }

  // [POST] /api/posts/:id/comments
  async addComment(req, res, next) {
    try {
      const { id } = req.params;
      const { contentBid } = req.body; // Chắc chắn là comment được truyền lên đúng
      const userId = req.user ? req.user.userId : null; // Kiểm tra xem user có tồn tại hay không
      console.log("🚀 ~ PostController ~ addComment ~ req.user:", req.user);

      // Log các giá trị để kiểm tra
      console.log("postId:", id);
      console.log("contentBid:", contentBid);
      console.log("userId:", userId);

      // Kiểm tra nếu có dữ liệu thiếu
      if (!contentBid || !userId) {
        return res.status(400).json({ message: "Invalid data" });
      }

      const post = await Post.findById(id);
      const userData = await User.findById(userId);
      console.log("🚀 ~ PostController ~ addComment ~ userData:", userData);

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const newComment = new Comment({
        postId: id,
        userId,
        contentBid,
        createAt: new Date(),
      });

      await newComment.save();

      const comments = await Comment.find({ postId: id });

      // Lọc và tìm bid cao nhất
      const sortedBids = comments
        .filter((comment) => !isNaN(comment.contentBid))
        .sort((a, b) => b.contentBid - a.contentBid);

      let highestBid = null;
      let highestBidder = null;

      if (sortedBids.length > 0) {
        // Kiểm tra nếu comment mới là bid cao nhất
        if (parseFloat(contentBid) >= parseFloat(sortedBids[0].contentBid)) {
          highestBid = parseFloat(contentBid);
          highestBidder = userData;
        } else {
          highestBid = sortedBids[0].contentBid;
          highestBidder = await User.findById(sortedBids[0].userId);
        }
      }

      const commentWithUser = {
        ...newComment.toObject(),
        user: userData.toObject(),
      };
      const io = getSocketIO();
      io.to(id).emit("newComment", {
        comment: commentWithUser,
        highestBid: highestBid,
        highestBidder: highestBidder ? highestBidder.toObject() : null,
      });

      res.status(201).json({
        comment: commentWithUser,
        highestBid: highestBid,
        highestBidder: highestBidder ? highestBidder.toObject() : null,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error adding comment" });
    }
  }

  async updatePost(req, res, next) {
    const { id } = req.params; // Lấy ID từ route parameter
    const { name, description, startTime, endTime } = req.body; // Lấy các trường từ body request

    try {
      // Tìm bài viết và cập nhật các trường
      const updatedPost = await Post.findByIdAndUpdate(
        id,
        { name, description, startTime, endTime },
        { new: true, runValidators: true } // `new: true` trả về post đã cập nhật
      );

      if (!updatedPost) {
        return res.status(404).json({ message: "Post not found" });
      }

      res.status(200).json({
        message: "Post updated successfully",
        post: updatedPost,
      });
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Failed to update post", error });
    }
  }

  async deletePost(req, res, next) {
    const postId = req.params.id;
    console.log("🚀 ~ PostController ~ deletePost ~ postId:", postId);

    try {
      // Tìm bài viết và đánh dấu là đã xóa
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Cập nhật `isDeleted` thành `true`
      post.isDeleted = true;
      await post.save();

      res.status(200).json({ message: "Post soft-deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      next(error);
    }
  }

  async search(req, res, next) {
    try {
      console.log("req.data", req.data);
      const searchTerm = req.query.query || ""; // Lấy từ query string
      console.log("🚀 ~ PostController ~ search ~ searchTerm:", req);
      const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9 ]/g, ""); // Xử lý ký tự đặc biệt

      const data = await Post.find({
        $or: [{ name: { $regex: new RegExp(searchNoSpecialChar, "i") } }],
      });

      console.log("🚀 ~ PostController ~ search ~ data:", data);

      res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  // Thêm feedback từ admin
  async addFeedback(req, res, next) {
    const { id } = req.params;
    const { feedback } = req.body;

    try {
      const post = await Post.findById(id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      post.feedback = feedback;
      post.isBlurred = true; // Làm mờ bài viết
      await post.save();

      res.status(200).json({ message: "Feedback added successfully", post });
    } catch (error) {
      console.error("Error adding feedback:", error);
      res.status(500).json({ message: "Failed to add feedback", error });
    }
  }

  // Gỡ feedback từ admin
  async removeFeedback(req, res, next) {
    const { id } = req.params;

    try {
      const post = await Post.findById(id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      post.feedback = null; // Xóa feedback
      post.isBlurred = false; // Mở khóa bài viết
      await post.save();

      res.status(200).json({ message: "Feedback removed successfully", post });
    } catch (error) {
      console.error("Error removing feedback:", error);
      res.status(500).json({ message: "Failed to remove feedback", error });
    }
  }
}

module.exports = new PostController();
