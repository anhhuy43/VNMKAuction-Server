const userRouter = require('./user')
const postsRouter = require('./posts')
const adminRouter = require('./admin')

function route(app) {

  app.use('/api/user', userRouter)
  app.use('/api/posts', postsRouter)
  app.use('/api/admin', adminRouter)
  
}

module.exports = route;

