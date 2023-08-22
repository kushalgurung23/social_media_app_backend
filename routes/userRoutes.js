const express = require('express')
const router = express.Router()

const {
    editProfilePicture,
    editUserDetails,
    getMyDetails,
    getOtherUserDetails
} = require('../controllers/userControllers')

router.route('/edit-profile-picture').patch(editProfilePicture)
router.route('/edit-user-details').patch(editUserDetails)
router.route('/get-my-details').get(getMyDetails)
router.route('/get/:id').get(getOtherUserDetails)

module.exports = router