const express = require('express')
const router = express.Router()

const {
    getAllServices,
    getServiceById,
    toggleServiceSave,
    getAllSavedServices,
    getAllServiceCategories
} = require('../controllers/servicesControllers')

router.route('/').get(getAllServices)
router.route('/saved').get(getAllSavedServices)
router.route('/toggle-save').post(toggleServiceSave)
router.route('/categories').get(getAllServiceCategories)
router.route('/:id').get(getServiceById)


module.exports = router