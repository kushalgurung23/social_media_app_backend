const express = require('express')
const router = express.Router()
const {
    getAllPosts,
    createNewPost,
    getPostById,
    updatePost,
    deletePost,
    deletePostImage,
    togglePostLike,
    togglePostSave,
    newsPostComment,
    getAllNewsPostComments
} = require('../controllers/postControllers')

router.route('/').get(getAllPosts).post(createNewPost)
router.route('/toggle-like').post(togglePostLike)
router.route('/toggle-save').post(togglePostSave)
router.route("/image/:id").delete(deletePostImage)
router.route('/comments').get(getAllNewsPostComments).post(newsPostComment)
router.route("/:id").get(getPostById).patch(updatePost).delete(deletePost)

module.exports = router