const db = require('../config/db')

class NewsPostsComments {
    constructor({
        newsPost, 
        comment,
        commentBy,
        createdAt,
        updatedAt
    }) {
        this.newsPost = newsPost
        this.comment = comment
        this.commentBy = commentBy
        this.createdAt = createdAt
        this.updatedAt = updatedAt
    }

    async save() {
    
        const sql = `INSERT INTO news_posts_comments(
            news_post,
            comment, 
            comment_by,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?)`
        
        await db.execute(sql, [
            this.newsPost, 
            this.comment, 
            this.commentBy,
            this.createdAt,
            this.updatedAt
        ])
    }

    static async getAllPostComments({newsPostId, offset, limit}) {
        const countSql = 
        `
            SELECT COUNT(*) AS total_comments FROM news_posts_comments pc
            INNER JOIN news_posts n on pc.news_post = n.id
            WHERE pc.news_post = ? AND n.is_active = ?
        `
        const countValues = [!newsPostId ? 0 : newsPostId, true]
        const [count, countField] = await db.execute(countSql, countValues)
        const totalCommentCount = count[0].total_comments

        const commentSql = `  
        SELECT comments
        FROM (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', c.id,
                    'comment', c.comment,
                    'created_at', c.created_at,
                    'updated_at', c.updated_at,
                    'comment_by', (
                        SELECT JSON_OBJECT (
                            'id', u.id,
                            'username', u.username,
                            'profile_picture', u.profile_picture
                        )
                        FROM users u
                        WHERE u.id = c.comment_by AND u.is_active = ?
                    )
                )
            ) AS comments
            FROM (
                SELECT *
                FROM news_posts_comments
                WHERE news_post = ?
                ORDER BY updated_at DESC
                LIMIT ?
                OFFSET ?
            ) AS c
        ) AS subquery
        
        `
        const commentValues = [true, !newsPostId ? 0 : newsPostId, limit.toString(), offset.toString()]
        const [comments, _] = await db.execute(commentSql, commentValues)
        if(comments.length === 0) {
            return {totalCommentCount, comments: false}
        }
        // JSON.stringify: convert object or value to json string
        // JSON.parse: convert json to object
        const parsedComments = JSON.parse(JSON.stringify(comments[0].comments))
        return {totalCommentCount, comments: parsedComments}
    }

}

module.exports = NewsPostsComments
