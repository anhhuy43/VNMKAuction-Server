const express = require('express');
const app = express();
const path = require('path');
const methodOverride = require('method-override');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const http = require('http');
const cors = require('cors');
const db = require('./config/db');
const User = require('./app/models/User')
const bcrypt = require("bcrypt");
const route = require('./routes');
const { initializeSocket } = require('./socket'); 

const port = 3000;

db.connect();


const ensureAdminAccount = async () => {
  const adminData = {
    email: 'admin@admin.com',
    firstName: 'admin',
    lastName: 'admin',
    password: '123',
    role: 'admin',
  };

  try {
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminData.password, 10);
      adminData.password = hashedPassword;

      const admin = new User(adminData);
      await admin.save();
      console.log('Tài khoản admin đã được tạo thành công!');
    } else {
      console.log('Tài khoản admin đã tồn tại!');
    }
  } catch (error) {
    console.error('Lỗi khi kiểm tra/tạo tài khoản admin:', error);
  }
};

(async () => {
  await ensureAdminAccount();
})();

app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.json());
app.use(methodOverride('_method'));
app.use(morgan('combined'));
app.use(cookieParser());

route(app);

const server = http.createServer(app);

initializeSocket(server);

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
