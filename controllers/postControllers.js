const NewsPosts = require('../models/NewsPosts')
const CustomError = require('../errors/index')
const {StatusCodes} = require('http-status-codes')
const {uploadSingleImage, uploadMultipleImages, ImageTypeEnum} = require('../utils/')
const PostsImages = require('../models/NewsPostsImages')
const NewsPostsComments = require('../models/NewsPostsComments')

const getAllPosts = async (req, res) => {
    const userId = req.user.userId
    const {search, order_by} = req.query
    
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const offset = (page -1) * limit

    const {totalPostsCount, posts} = await NewsPosts.findAll({offset, limit, search, order_by, userId})
    if(!posts) {
        return res.status(StatusCodes.OK).json({
            status: "Success",
            count: totalPostsCount, 
            page,
            limit,
            posts: []})
    }
    res.status(StatusCodes.OK).json({
        status: "Success",
        count: totalPostsCount, 
        page,
        limit,
        posts})
}

const createNewPost = async (req, res) => {

    const {userId} = req.user
    const {
        title, 
        content
    } = req.body

    if(!title || !content) {
        throw new CustomError.BadRequestError('Please provide all details.')
    }
    const newsPost = new NewsPosts({
        title, 
        content, 
        posted_by: userId
    })
    const newPostId = await newsPost.save();
    // IF POST ALSO HAS IMAGES
    if(req.files) {
        const imageFiles = req.files.image
        // MULTIPLE IMAGES
        if(imageFiles.length && imageFiles.length > 1) {
            const allImagesPath = await uploadMultipleImages(req, res, newPostId, ImageTypeEnum.newsPostImage)
            if(allImagesPath) {
                await PostsImages.addMultiplePostImages({postId: newPostId, allImagesPath})
            }
        }
        // SINGLE IMAGE
        else if(!imageFiles.length) {
            const imagePath = await uploadSingleImage(req, res, newPostId, ImageTypeEnum.newsPostImage)
            if(imagePath) {
                await PostsImages.addSinglePostImage({postId: newPostId, imagePath})
            }
        }
    }

    res.status(StatusCodes.CREATED).json({status: "Success",  msg: "Post is created successfully."})
}

const getPostById = async (req, res) => {
    const {id:postId} = req.params
    const post = await NewsPosts.getOnePost({postId, userId: req.user.userId})
    if(!post) {
      throw new CustomError.NotFoundError(`Post of id: ${postId} is not available.`)
    }
    res.status(StatusCodes.OK).json({status: "Success", news_post: post})
}

const updatePost = async (req, res) => {
    const {id:postId} = req.params
    if(Object.keys(req.body).length === 0) {
        throw new CustomError.BadRequestError('Post details cannot be empty.')
    }
    const post = await NewsPosts.checkById(postId)
    if(!post) {
        throw new CustomError.NotFoundError(`Post of id: ${postId} does not exists.`)
    }
    await NewsPosts.updateById({postId, toBeUpdatedFields: req.body})
    res.status(StatusCodes.OK).json({status: "Success", msg: "Post is updated successfully."})
}

const deletePost = async (req, res) => {
    if(!req.params.id) {
        throw new CustomError.BadRequestError('Provide post id.')
    }
    const {id:postId} = req.params
    const post = await NewsPosts.checkById(postId)
    
    if(!post || post?.is_active === 0) {
        throw new CustomError.NotFoundError(`Post of id: ${postId} does not exists.`)
    }
    await NewsPosts.deletePost({postId})
    res.status(StatusCodes.OK).json({status: 'Success', msg: "Post is deleted successfully."})
}

const deletePostImage = async (req, res) => {
    if(!req.params.id) {
        throw new CustomError.BadRequestError('Provide post\'s image id.')
    }

    const {id:imageId} = req.params
    const postImage = await PostsImages.findPostImageById({imageId})
    if(!postImage) {
        throw new CustomError.NotFoundError(`Post image of id: ${imageId} does not exists.`)
    }
    await PostsImages.deletePostImage({imageId})
    res.status(StatusCodes.OK).json({status: 'Success', msg: "Post image is deleted successfully."})
}

const togglePostLike = async (req, res) => {
    const {userId} = req.user
    const {post_id} = req.body
    if(!post_id) {
        throw new CustomError.BadRequestError('Please provide post id.')
    }
    const post = await NewsPosts.checkById(post_id)
    if(!post) {
        throw new CustomError.NotFoundError('Please make sure you have provided a correct post id.')
    }
    await NewsPosts.togglePostLike({postId: post_id, userId})
    res.status(StatusCodes.OK).json({
        status: 'Success',
        msg: 'Successfully toggled the post\'s like status.'
    })
}

const togglePostSave = async (req, res) => {
    const {userId} = req.user
    const {post_id} = req.body
    if(!post_id) {
        throw new CustomError.BadRequestError('Please provide post id.')
    }
    const post = await NewsPosts.checkById(post_id)
    if(!post) {
        throw new CustomError.NotFoundError('Please make sure you have provided a correct post id.')
    }
    await NewsPosts.togglePostSave({postId: post_id, userId})
    res.status(StatusCodes.OK).json({
        status: 'Success',
        msg: 'Successfully toggled the post\'s save status.'
    })
}

const newsPostComment = async (req, res) => {
    const {userId} = req.user
    const {post_id, comment} = req.body
    if(!post_id || !comment) {
        throw new CustomError.BadRequestError('Please provide post_id and comment.')
    }
    const post = await NewsPosts.checkById(post_id)
    if(!post) {
        throw new CustomError.NotFoundError('Please make sure you have provided a correct post id.')
    }
    const newsPostsComment = new NewsPostsComments({newsPost: post_id, comment, commentBy: userId})
    await newsPostsComment.save()
    res.status(StatusCodes.OK).json({
        status: 'Success',
        msg: 'Commented successfully.'
    })
}

const getAllNewsPostComments = async (req, res) => {
    const {post_id: newsPostId} = req.body
    if(!newsPostId) {
        throw new CustomError.BadRequestError('Please provide post_id.')
    }
    const post = await NewsPosts.checkById(newsPostId)
    if(!post) {
        throw new CustomError.NotFoundError('Please make sure you have provided a correct post_id.')
    }
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const offset = (page-1) * limit

    const {totalCommentCount, comments} = await NewsPostsComments.getAllPostComments({newsPostId, offset, limit})
    if(!comments) {
        return res.status(StatusCodes.OK).json({
            status: "Success",
            count: totalCommentCount, 
            page,
            limit,
            comments: []})
    }
    res.status(StatusCodes.OK).json({
        status: "Success",
        count: totalCommentCount, 
        page,
        limit,
        comments})
}

module.exports = {
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
}