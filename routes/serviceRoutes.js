const express = require('express')
const router = express.Router()

const {
    getAllServices,
    getServiceById,
    toggleServiceSave,
    getAllSavedServices
} = require('../controllers/servicesControllers')

router.route('/').get(getAllServices)
router.route('/saved').get(getAllSavedServices)
router.route('/:id').get(getServiceById)
router.route('/toggle-save').post(toggleServiceSave)


module.exports = router