const express = require('express')
const router = express.Router()

const {
    editProfilePicture,
    editUserDetails,
    getMyDetails
} = require('../controllers/userControllers')

router.route('/edit-profile-picture').patch(editProfilePicture)
router.route('/edit-user-details').patch(editUserDetails)
router.route('/get-my-details').get(getMyDetails)

module.exports = router