require("dotenv").config(); // ALLOWS ENVIRONMENT VARIABLES TO BE SET ON PROCESS.ENV SHOULD BE AT TOP
require('express-async-errors')

const express = require("express");
const app = express();
const fileUpload = require('express-fileupload')
const firebaseAdmin = require('firebase-admin')
const firebaseServiceAccount = require('./config/c-talent-firebase-adminsdk.json')

// REQUIRE ROUTES
const postRouter = require('./routes/postRoutes')
const authRouter = require('./routes/authRoutes')
const userRouter = require('./routes/userRoutes')
const pushNotificationRouter = require('./routes/pushNotificationRoutes')

// REQUIRE MIDDLEWARES
const errorHandlerMiddleware = require('./middlewares/error-handler')
const notFoundMiddleWare = require('./middlewares/not-found')

// MIDDLEWARE
app.use(express.static('./public')) // make this static file publicly available
app.use(express.json()); // parse json bodies in the request object
app.use(fileUpload()) // upload files such as image, pdf

const {authenticateUser} = require('./middlewares/authentication')

// ROUTES
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/posts', authenticateUser, postRouter)
app.use('/api/v1/users', authenticateUser, userRouter)
app.use('/api/v1/push-notification', authenticateUser, pushNotificationRouter)

// MIDDLEWARE
app.use(notFoundMiddleWare);
app.use(errorHandlerMiddleware);

// Listen on pc port
const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    const certificatePath = firebaseAdmin.credential.cert(firebaseServiceAccount)
    firebaseAdmin.initializeApp({
        credential: certificatePath,
        projectId: process.env.FIREBASE_PROJECT_ID
    })
    app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
  }
  catch (error) {
    console.log(error);
  }
}

start()