const express = require('express')
const router = express.Router()

const {
    editProfilePicture,
    editUserDetails,
    getMyDetails,
    getOtherUserDetails,
    getFollowings,
    getFollowers
} = require('../controllers/userControllers')

router.route('/edit-profile-picture').patch(editProfilePicture)
router.route('/edit-user-details').patch(editUserDetails)
router.route('/get-my-details').get(getMyDetails)
router.route('/followings').get(getFollowings)
router.route('/followers').get(getFollowers)
router.route('/get/:id').get(getOtherUserDetails)

module.exports = router