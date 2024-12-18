const express = require('express');
const router = express.Router();
const upload = require('../config/multer-config');
const postController = require('../app/controllers/PostController');
const authenticateJWT = require('../middlewares/authenticateJWT');
const adminAuth = require('../middlewares/adminAuth');

router.get('/list-posts', postController.listPosts);
router.get('/my-posts', postController.myPosts);
router.get('/search', postController.search); 

router.get('/:id', postController.postDetail);
router.get("/:id/comments", postController.getComments);
router.post("/:id/comments", authenticateJWT, postController.addComment);
router.put("/:id", postController.updatePost);
router.delete("/:id", postController.deletePost);

router.post('/create-post', upload.array("images", 5), postController.createPost);

router.post('/:id/feedback', adminAuth, postController.addFeedback);
router.delete('/:id/feedback', adminAuth, postController.removeFeedback);

module.exports = router;
