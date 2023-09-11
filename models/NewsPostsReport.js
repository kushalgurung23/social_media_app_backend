const db = require('../config/db')

class NewsPostsReports {
    constructor({
        newsPost, 
        reason,
        reportedBy,
        createdAt,
        updatedAt
    }) {
        this.newsPost = newsPost
        this.reason = reason
        this.reportedBy = reportedBy
        this.createdAt = createdAt
        this.updatedAt = updatedAt
    }

    async save() {
    
        const sql = `INSERT INTO reported_news_posts(
            news_post,
            reason, 
            reported_by,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?)`
        
        await db.execute(sql, [
            this.newsPost, 
            this.reason, 
            this.reportedBy,
            this.createdAt,
            this.updatedAt
        ])
    }

}

module.exports = NewsPostsReports
