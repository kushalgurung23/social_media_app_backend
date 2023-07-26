const db = require('../config/db')
const mysql = require('mysql2')
const {getCurrentDateTime} = require('../utils')

class PostsImages {
    
    static async addSinglePostImage({postId, imagePath}) {
        const dateTime = getCurrentDateTime()
        const sql = 
        `
        INSERT INTO posts_images (
            post_id,
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
        "INSERT INTO posts_images (post_id, image, created_at, updated_at, is_active) VALUES ?"
        await db.execute(mysql.format(sql, [insertValues]))
    }

    static async findPostImageById({imageId}) {
        const sql = `SELECT * FROM posts_images WHERE id = ? AND is_active = ?`
        const [user, _] = await db.execute(sql, [imageId, true])
        return user[0]
    }

    static async deletePostImage({imageId}) {
        const dateTime = getCurrentDateTime()
        const sql = `UPDATE posts_images SET is_active = ?, updated_at = ? 
        WHERE id = ? AND is_active = ?`
        await db.execute(sql, [false, dateTime, imageId, true])
    }

}

module.exports = PostsImages