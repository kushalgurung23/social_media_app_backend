const path = require('path')
const CustomError = require('../errors')
const uuid = require('uuid')

const uploadSingleImage = async(req, res, id, imageType) => {
    // check if file exists
    if(!req.files) {
        throw new CustomError.BadRequestError('No file uploaded')
    }
    
    // LENGTH WILL ONLY BE AVAILABLE WHEN MULTIPLE IMAGES ARE SELECTED.
    const imageFile = req.files.image
    if(imageFile.length && imageFile.length > 1) {
        throw new CustomError.BadRequestError('Please provide only one image.')
    }
    // check format
    const productImage = req.files.image;   
    if(!productImage.mimetype.startsWith('image')) {
        throw new CustomError.BadRequestError('Please upload image');
    }
    // check size
    const maxSize = 40000000
    if(productImage.size > maxSize) {
        throw new CustomError.BadRequestError('Please upload image smaller than 40 MB')
    }
    // GENERATING UNIQUE ID FOR IMAGE
    const uniquePhotoId = uuid.v4();

    // IMAGE EXTENSION IS ADDED AT THE END. [.pop() will return the last item of array after splitted through delimiter "/"].
    // imageType and id will be used for naming convention, so that whenever user wants to access back their picture, it will be easier to search.
    const uniqueImageName = `${imageType}-${id}-${uniquePhotoId}.${productImage.mimetype.split("/").pop()}`;
    const imagePath = path.join(__dirname, '../public/uploads/'+`${uniqueImageName}`);
    
    await productImage.mv(imagePath);
    // return res.status(StatusCodes.OK).send({image: {src: `}`}});
    return `/uploads/${uniqueImageName}`;
}

const uploadMultipleImages = async(req, res, id, imageType) => {
    // check if file exists
    if(!req.files) {
        throw new CustomError.BadRequestError('No file uploaded')
    }
    
    const productImages = req.files.image;   
    if(!productImages.length) {
        throw new CustomError.BadRequestError('Images are not received. Please try again');
    }
    else if(productImages.length && productImages.length > 1) {
        const maxSize = 40000000
        
        let toBeUploadedImages = []
        let allImagesPath = []

        // LOOPING THROUGH EACH IMAGES
        for(let i = 0; i < productImages.length; i++) {
            // check format
            if(!productImages[i].mimetype.startsWith('image')) {
                throw new CustomError.BadRequestError('Please upload images only');
            }
            // check size
            if(productImages[i].size > maxSize) {
                throw new CustomError.BadRequestError('Please upload image smaller than 40 MB')
            }

            // GENERATING UNIQUE ID FOR IMAGE
            const uniquePhotoId = uuid.v4();
            // IMAGE EXTENSION IS ADDED AT THE END. [.pop() will return the last item of array after splitted through delimiter "/"].
            // imageType and id will be used for naming convention, so that whenever user wants to access back their picture, it will be easier to search.
            const uniqueImageName = `${imageType}-${id}-${uniquePhotoId}.${productImages[i].mimetype.split("/").pop()}`;
            const imagePath = path.join(__dirname, '../public/uploads/'+`${uniqueImageName}`);

            // This array will store the images which are to be uploaded in the server.
            toBeUploadedImages.push({image: productImages[i], image_path: imagePath})

            // This array will store the images path that will be returned from this function.
            allImagesPath.push(`/uploads/${uniqueImageName}`)
        }
        // IF THERE ARE NO ERRORS, THEN ONLY IMAGES WILL BE UPLOADED TO THE UPLOADS FOLDER
        for(let i = 0; i < toBeUploadedImages.length; i++) {
            await toBeUploadedImages[i].image.mv(toBeUploadedImages[i].image_path)
        }
        return(allImagesPath);
    }
}

module.exports = {uploadSingleImage, uploadMultipleImages}