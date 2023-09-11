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
    getAllNewsPostComments,
    getAllNewsPostLikes,
    reportNewsPost
} = require('../controllers/postControllers')

router.route('/').get(getAllPosts).post(createNewPost)
router.route('/toggle-like').post(togglePostLike)
router.route('/toggle-save').post(togglePostSave)
router.route("/image/:id").delete(deletePostImage)
router.route('/comments').post(newsPostComment)
router.route('/:id/comments').get(getAllNewsPostComments)
router.route('/:id/likes').get(getAllNewsPostLikes)
router.route('/report').post(reportNewsPost)
router.route("/:id").get(getPostById).patch(updatePost).delete(deletePost)

module.exports = router