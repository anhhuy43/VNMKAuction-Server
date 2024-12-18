const userRouter = require('./user')
const postsRouter = require('./posts')

function route(app) {

  app.use('/api/user', userRouter)
  app.use('/api/posts', postsRouter)
  
}

module.exports = route;

