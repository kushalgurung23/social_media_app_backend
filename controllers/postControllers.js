const NewsPosts = require('../models/NewsPosts')
const CustomError = require('../errors/index')
const {StatusCodes} = require('http-status-codes')
const {uploadSingleImage, uploadMultipleImages, ImageTypeEnum, formatUtcTime} = require('../utils/')
const PostsImages = require('../models/NewsPostsImages')
const NewsPostsComments = require('../models/NewsPostsComments')
const NewsPostsLikes = require('../models/NewsPostsLike')
const NewsPostsReports = require('../models/NewsPostsReport')

const getAllPosts = async (req, res) => {
    const userId = req.user.userId
    const {search, order_by} = req.query
    
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const offset = (page -1) * limit

    const {totalPostsCount, posts} = await NewsPosts.findAll({offset, limit, search, order_by, userId})
    return res.status(StatusCodes.OK).json({
        status: "Success",
        count: totalPostsCount, 
        page,
        limit,
        posts: !posts ? [] : posts})
}

const getMyCreatedPosts = async (req, res) => {
    const userId = req.user.userId
    const {search, order_by} = req.query
    
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const offset = (page -1) * limit

    const {totalPostsCount, posts} = await NewsPosts.getMyCreatedPost({offset, limit, search, order_by, userId})
    return res.status(StatusCodes.OK).json({
        status: "Success",
        count: totalPostsCount, 
        page,
        limit,
        posts: !posts ? [] : posts})
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
    const post = await NewsPosts.getOnePost({postId: newPostId, userId})
    res.status(StatusCodes.CREATED).json({status: "Success",  post: {news_post: post}})
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
    await NewsPostsLikes.togglePostLike({postId: post_id, userId})
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
    const {post_id, comment, created_at_utc, updated_at_utc} = req.body
    if(!post_id || !comment || !created_at_utc || !updated_at_utc) {
        throw new CustomError.BadRequestError('Please provide post_id, comment, created_at and updated_at.')
    }
    const post = await NewsPosts.checkById(post_id)
    if(!post) {
        throw new CustomError.NotFoundError('Please make sure you have provided a correct post id.')
    }
    const createdAt = formatUtcTime({utcDate: new Date(created_at_utc)})
    const updatedAt = formatUtcTime({utcDate: new Date(updated_at_utc)})
    const newsPostsComment = new NewsPostsComments({
        newsPost: post_id, 
        comment, 
        commentBy: userId,
        createdAt,
        updatedAt
    })
    await newsPostsComment.save()
    res.status(StatusCodes.OK).json({
        status: 'Success',
        msg: 'Commented successfully.'
    })
}

const getAllNewsPostComments = async (req, res) => {
    const {id: newsPostId} = req.params
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
    res.status(StatusCodes.OK).json({
        status: "Success",
        count: totalCommentCount, 
        page,
        limit,
        comments: !comments ? [] : comments})
}

const getAllNewsPostLikes = async (req, res) => {
    console.log(req.user);
    const {userId: currentUserId} = req.user
    const {id: newsPostId} = req.params
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

    const {totalLikeCount, likes} = await NewsPostsLikes.getAllPostLikes({newsPostId, offset, limit, currentUserId})
    res.status(StatusCodes.OK).json({
        status: "Success",
        count: totalLikeCount, 
        page,
        limit,
        likes: !likes ? [] : likes})
}

const reportNewsPost = async (req, res) => {
    const {userId} = req.user
    const {post_id, reason, created_at_utc, updated_at_utc} = req.body
    if(!post_id || !reason || !created_at_utc || !updated_at_utc) {
        throw new CustomError.BadRequestError('Please provide post_id, reason, created_at_utc and updated_at_utc.')
    }
    const post = await NewsPosts.checkById(post_id)
    if(!post) {
        throw new CustomError.NotFoundError('Please make sure you have provided a correct post id.')
    }
    const createdAt = formatUtcTime({utcDate: new Date(created_at_utc)})
    const updatedAt = formatUtcTime({utcDate: new Date(updated_at_utc)})
    const newsPostsReport = new NewsPostsReports({
        newsPost: post_id, 
        reason, 
        reportedBy: userId,
        createdAt,
        updatedAt
    })
    await newsPostsReport.save()
    res.status(StatusCodes.OK).json({
        status: 'Success',
        msg: 'Reported successfully.'
    })
}

// MY TOPIC POST IN PROFILE TAB: It does not have all data of news
const getMyNewsPosts = async (req, res) => {
    const {userId} = req.user
    const {order_by} = req.query
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 6
    const offset = (page-1) * limit

    const {totalPostsCount, news} = await NewsPosts.getUsersCreatedTopics({userId, offset, limit, order_by})
    res.status(StatusCodes.OK).json({
        status: "Success",
        count: totalPostsCount, 
        page,
        limit,
        news: !news ? [] : news})
}

// MY BOOKMARK TOPIC IN PROFILE TAB
const getBookmarkNewsPosts = async (req, res) => {
    const {userId} = req.user
    const {order_by} = req.query
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 6
    const offset = (page-1) * limit

    const {totalPostsCount, news} = await NewsPosts.getUsersBookmarkTopics({userId, offset, limit, order_by})
    res.status(StatusCodes.OK).json({
        status: "Success",
        count: totalPostsCount, 
        page,
        limit,
        news: !news ? [] : news})
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
    getAllNewsPostComments,
    getAllNewsPostLikes,
    reportNewsPost,
    getMyNewsPosts,
    getBookmarkNewsPosts,
    getMyCreatedPosts
}