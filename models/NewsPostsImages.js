const db = require('../config/db')
const mysql = require('mysql2')
const {getCurrentDateTime} = require('../utils')

class NewsPostsImages {
    
    static async addSinglePostImage({postId, imagePath}) {
        const dateTime = getCurrentDateTime()
        const sql = 
        `
        INSERT INTO news_posts_images (
            news_post,
            image,
            created_at,
            updated_at,
            is_active
        )
        VALUES (?, ?, ?, ?, ?)
        `
        await db.execute(sql, [postId, imagePath, dateTime, dateTime, true])
    }

    static async addMultiplePostImages({postId, allImagesPath}) {
        const dateTime = getCurrentDateTime()
        let insertValues = []
        for(let i = 0; i < allImagesPath.length; i++) {
            insertValues.push([postId, allImagesPath[i].toString(), dateTime, dateTime, true])
        }

        const sql = 
        "INSERT INTO news_posts_images (news_post, image, created_at, updated_at, is_active) VALUES ?"
        await db.execute(mysql.format(sql, [insertValues]))
    }

    static async findPostImageById({imageId}) {
        const sql = `SELECT * FROM news_posts_images WHERE id = ? AND is_active = ?`
        const [user, _] = await db.execute(sql, [imageId, true])
        return user[0]
    }

    static async deletePostImage({imageId}) {
        const sql = `DELETE FROM news_posts_images WHERE id = ? AND is_active = ?`
        await db.execute(sql, [imageId, true])
    }

}

module.exports = NewsPostsImages