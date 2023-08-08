const db = require('../config/db')
const {getCurrentDateTime} = require('../utils')

class NewsPostsComments {
    constructor({
        newsPost, 
        comment,
        commentBy
    }) {
        this.newsPost = newsPost
        this.comment = comment,
        this.commentBy = commentBy
    }

    async save() {
       const dateTime = getCurrentDateTime()
    
        const sql = `INSERT INTO news_posts_comments(
            news_post,
            comment, 
            comment_by,
            created_at,
            updated_at,
            is_active
        )
        VALUES (?, ?, ?, ?, ?, ?)`
        
        await db.execute(sql, [
            this.newsPost, 
            this.comment, 
            this.commentBy,
            dateTime, 
            dateTime, 
            true
        ])
    }

}

module.exports = NewsPostsComments
