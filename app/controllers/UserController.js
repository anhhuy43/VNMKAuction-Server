const User = require("../models/User");
const bcrypt = require("bcrypt");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const jwt = require("jsonwebtoken");
require('dotenv').config();
dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(timezone);

class UserController {
  // async login(req, res, next) {
  //   try {
  //     const foundUser = await User.findOne({ email: req.body.email });

  //     if (!foundUser) {
  //       return res.status(404).json({
  //         success: false,
  //         message: "User Not Found!",
  //       });
  //     } else {
  //       //compare the hash password from the database with the plain text
  //       const isPasswordMatch = await bcrypt.compare(
  //         req.body.password,
  //         foundUser.password
  //       );

  //       if (isPasswordMatch) {
  //         const token = jwt.sign(
  //           { userId: foundUser._id.toString() },
  //           authConstant.JWT_SECRET_KEY
  //         );

  //         return res.status(200).json({
  //           success: true,
  //           message: "Login Successful",
  //           token,
  //         });
  //       } else {
  //         return res.status(401).json({
  //           success: false,
  //           message: "Wrong Password",
  //         });
  //       }
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     return res.status(500).json({
  //       success: false,
  //       message: "Server error",
  //     });
  //   }
  // }

  async login(req, res, next) {
    try {
      const foundUser = await User.findOne({ email: req.body.email });

      // Kiểm tra nếu user không tồn tại
      if (!foundUser) {
        return res.status(404).json({
          success: false,
          message: "User Not Found!",
        });
      }

      // Kiểm tra role của user
      if (foundUser.role !== "user") {
        return res.status(403).json({
          success: false,
          message: "Access denied: Not A User!",
        });
      }

      // So sánh mật khẩu
      const isPasswordMatch = await bcrypt.compare(
        req.body.password,
        foundUser.password
      );

      if (isPasswordMatch) {
        const token = jwt.sign(
          { userId: foundUser._id.toString(), role: foundUser.role },
          process.env.JWT_SECRET_KEY
        );

        return res.status(200).json({
          success: true,
          message: "Login Successful",
          token,
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "Wrong Password",
        });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }

  async create(req, res, next) {
    const formData = req.body;
    console.log("🚀 ~ UserController ~ create ~ formData:", formData);

    const formData1 = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
    };

    // Kiểm tra xem người dùng đã tồn tại chưa
    const existingUser = await User.findOne({ email: formData1.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User Already Exists!",
      });
    }

    // Mã hóa mật khẩu
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(formData1.password, saltRounds);
    formData1.password = hashedPassword;

    const user = new User(formData1);
    user
      .save()
      .then(() => {
        return res.status(201).json({
          success: true,
          message: "User created successfully",
        });
      })
      .catch(next);
  }

  async info(req, res, next) {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({ message: "Token Not Found" });
      }

      const decode = jwt.decode(token, process.env.JWT_SECRET_KEY);

      const userDetail = await User.findOne({ _id: decode.userId }).lean();

      if (!userDetail) {
        return res.status(404).json({ message: "User Not Found" });
      }

      res.json({ user: userDetail });
    } catch (err) {
      console.log("error fetch info", err);
      next();
    }
  }

  // [GET] /user/edit
  async editUser(req, res, next) {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({ message: "Token Not Found" });
      }

      const decode = jwt.decode(token, process.env.JWT_SECRET_KEY);

      const userDetail = await User.findOne({ _id: decode.userId }).lean();

      if (!userDetail) {
        return res.status(404).json({ message: "User Not Found" });
      }

      res.json({ user: userDetail });
    } catch (err) {
      console.log("err", err);
      next();
    }
  }

  // [PUT] /user/:id
  async updateUser(req, res, next) {
    console.log("userid", req.body._id);
    try {
      await User.updateOne({ _id: req.body._id }, req.body);

      res.status(201).json({
        sucess: true,
        message: "Update successfully",
      });
    } catch (err) {
      console.log("error update user", err);
      next();
    }
  }

  async updatePassword(req, res, next) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      console.log("🚀 ~ UserController ~ updatePassword ~ token:", token);

      if (!token) {
        return res.status(401).json({ message: "Token Not Found" });
      }

      const decode = jwt.decode(token, process.env.JWT_SECRET_KEY);

      const foundUser = await User.findOne({ _id: decode.userId });

      const isCheckPasswordMatch = await bcrypt.compare(
        req.body.password,
        foundUser.password
      );

      //check matches current password
      if (isCheckPasswordMatch) {
        const formData = req.body;

        const isCheckNewPasswordMatchCurrent = await bcrypt.compare(
          req.body.newPassword,
          foundUser.password
        );
        //check new password match current password
        if (isCheckNewPasswordMatchCurrent) {
          res.status(401).json({
            message: "Do not use your current password!",
          });
        } else {
          //hash the password using bcrypt
          const saltRounds = 10;
          const hashedPassword = await bcrypt.hash(
            formData.newPassword,
            saltRounds
          );
          await User.updateOne(
            { _id: decode.userId },
            {
              password: hashedPassword,
              message: "Password updated successfully",
            }
          ).then(() =>
            res.status(200).json({
              success: true,
            })
          );
        }
      } else {
        res.status(401).json({
          message: "Wrong Password",
        });
      }
    } catch {
      res.send("wrong details");
    }
  }
}

module.exports = new UserController();
