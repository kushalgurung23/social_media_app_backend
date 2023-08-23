const db = require('../config/db')
const {getCurrentDateTime} = require('../utils')

class NewsPostsLikes {
    static async togglePostLike({postId, userId}) {
        const dateTime = getCurrentDateTime()

        const findSql = `SELECT COUNT(*) AS COUNT FROM news_posts_likes pl
        INNER JOIN users u on u.id = pl.liked_by AND u.is_active = ?
        WHERE
        pl.news_post = ? AND pl.liked_by = ? AND pl.is_active = ?
        `
        const [count, _] = await db.execute(findSql, [true, postId, userId, true])
        
        const totalCount = count[0].COUNT;
        // IF USER HAS ALREADY LIKED THE POST, DELETE THE ROW
        if(totalCount === 1 || totalCount >= 1) {

            const deleteSql = `
            DELETE pl
            FROM news_posts_likes pl 
            INNER JOIN users u ON pl.liked_by = u.id
            WHERE pl.news_post = ? 
            AND pl.liked_by = ? 
            AND pl.is_active = ?
            AND u.is_active = ?
            `
            await db.execute(deleteSql, [postId, userId, true, true])
            
        }
        // ELSE INSERT THE ROW
        else {  
            const insertSql = 
            `
            INSERT INTO news_posts_likes (
                news_post,
                liked_by,
                created_at,
                updated_at,
                is_active
            )
            VALUES (?, ?, ?, ?, ?)
            `
            await db.execute(insertSql, [postId, userId, dateTime, dateTime, true])
        }
    }

    static async getAllPostLikes({newsPostId, offset, limit, currentUserId}) {
       
        const countSql = 
        `
            SELECT COUNT(*) AS total_likes FROM news_posts_likes pl
            INNER JOIN news_posts n on pl.news_post = n.id
            WHERE pl.news_post = ? AND pl.is_active = ? AND n.is_active = ?
        `
        const countValues = [!newsPostId ? 0 : newsPostId, true, true]
        const [count, countField] = await db.execute(countSql, countValues)
        const totalLikeCount = count[0].total_likes

        const likeSql = `  
        SELECT likes
        FROM (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', l.id,
                    'created_at', l.created_at,
                    'updated_at', l.updated_at,
                    'liked_by', (
                        SELECT JSON_OBJECT (
                            'id', u.id,
                            'username', u.username,
                            'profile_picture', u.profile_picture,
                            'user_type', u.user_type,
                            'is_followed', (
                                SELECT CASE WHEN EXISTS (
                                    SELECT 1
                                    FROM user_follows uf
                                    INNER JOIN users uu ON
                                    uf.followed_to = uu.id
                                    WHERE uf.followed_to = u.id AND 
                                    uf.followed_by = ? AND uf.is_active = ? AND uu.is_active = ?
                                ) THEN 1 ELSE 0 END
                            )
                        )
                        FROM users u
                        WHERE u.id = l.liked_by AND u.is_active = ?
                    )
                )
            ) AS likes
            FROM (
                SELECT *
                FROM news_posts_likes
                WHERE news_post = ? AND is_active = ?
                ORDER BY updated_at DESC
                LIMIT ?
                OFFSET ?
            ) AS l
        ) AS subquery
        `
        const likeValues = [currentUserId, true, true, true, !newsPostId ? 0 : newsPostId, true, limit.toString(), offset.toString()]
        const [likes, _] = await db.execute(likeSql, likeValues)
        if(likes.length === 0) {
            return {totalLikeCount, likes: false}
        }
        // JSON.stringify: convert object or value to json string
        // JSON.parse: convert json to object
        const parsedLikes = JSON.parse(JSON.stringify(likes[0].likes))
        return {totalLikeCount, likes: parsedLikes}
    }

}

module.exports = NewsPostsLikes
