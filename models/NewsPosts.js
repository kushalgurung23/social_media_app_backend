const db = require('../config/db')
const {getCurrentDateTime} = require('../utils')

class NewsPosts {
    constructor({
        title, 
        content,
        posted_by
    }) {
        this.title = title
        this.content = content,
        this.posted_by = posted_by
    }

    async save() {
       const dateTime = getCurrentDateTime()
    
        const sql = `INSERT INTO news_posts(
            title,
            content, 
            posted_by,
            created_at,
            updated_at,
            is_active
        )
        VALUES (?, ?, ?, ?, ?, ?)`
        
        const [result] = await db.execute(sql, [
            this.title, 
            this.content, 
            this.posted_by,
            dateTime, 
            dateTime, 
            true
        ])
        return(result.insertId);
    }

    static async findAll({offset, limit, search, order_by, userId}) {
        // TOTAL COUNT
        // For reported_news_posts, The LEFT JOIN ensures that all rows from the news_posts table 
        // are included, regardless of whether there is a matching row in the reported_news_posts table.
        // The WHERE clause filters for rows where the reported_news_posts.news_post field is NULL, 
        // indicating that there is no report associated with that news post by the specified user.
        let countSql = `
        SELECT COUNT(*) AS total_posts FROM news_posts p
        INNER JOIN users u on p.posted_by = u.id 
        LEFT JOIN reported_news_posts rnp ON
        p.id = rnp.news_post AND
        rnp.reported_by = ?
        WHERE p.is_active = ? AND u.is_active = ? AND rnp.news_post IS NULL`
        let countValues = [!userId? 0 : userId, true, true]
        if(search) {
            countSql+= ` AND title LIKE ?`
            countValues.push(`%${search}%`)
        }
       
        const [count, countField] = await db.execute(countSql, countValues)
        const totalPostsCount = count[0].total_posts
        
        let postsSql = this.getPostBaseQuery
        postsSql+= 
        `
            ,'comments', (
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
                                'profile_picture', u.profile_picture,
                                'user_type', u.user_type
                            )
                            FROM users u
                            WHERE u.id = c.comment_by AND u.is_active = ?
                        )
                    )
                )
                FROM (
                    SELECT 
                        pc.id, pc.comment, pc.created_at, pc.updated_at, pc.comment_by
                    FROM news_posts_comments pc
                    INNER JOIN users u ON pc.comment_by = u.id AND u.is_active = ?
                    WHERE pc.news_post = p.id 
                    ORDER BY pc.updated_at DESC 
                    LIMIT 2
                ) AS c 
                
            )
        ) AS news_post
                FROM news_posts p 
                INNER JOIN users u ON
                p.posted_by = u.id
                LEFT JOIN reported_news_posts rnp ON
                p.id = rnp.news_post AND
                rnp.reported_by = ?
            WHERE p.is_active = ? AND u.is_active = ? AND rnp.news_post IS NULL
        `
       
        let postsValues = [true, true, !userId ? 0 : userId, true, !userId ? 0 : userId, true, true, true, true, true, true,  !userId ? 0 : userId, true, true]
        if(search) {
            postsSql+= ` AND p.title LIKE ?`
            postsValues.push(`%${search}%`)
        }
        postsSql+= " GROUP BY p.id"
        // IF order_by query string is not selected, api will be sent in desc order
        if(!order_by) {
            postsSql+= " ORDER BY p.created_at DESC"
        }
        if(order_by) {
            // order_by will accept two values: created_at_asc or created_at_desc
            if(order_by === 'created_at_asc') {
                postsSql+= " ORDER BY p.created_at ASC"
            }
            // IF ANYTHING ELSE EXCEPT created_at_asc is provided, the result will be sent in descending order.
            else {
                postsSql+= " ORDER BY p.created_at DESC"
            }
        }
        postsSql+= " LIMIT ? OFFSET ?"
        postsValues.push(limit.toString(), offset.toString())
        const [posts, _] = await db.execute(postsSql, postsValues)
        
        if(posts.length === 0) {
            return {totalPostsCount, posts:false};
        }
        return {totalPostsCount, posts}
    }

    static async checkById(id) {
        const sql = `
        SELECT p.id FROM news_posts p
        INNER JOIN users u ON
        p.posted_by = u.id
        WHERE p.is_active = ? 
        AND p.id = ?
        AND u.is_active = ?
        `
        const [post, _] = await db.execute(sql, [true, id, true])
        return post[0]
    }

    // WHEN WE WANT TO SEE DETAILS OF ONLY ONE POST
    static async getOnePost({postId, userId}) {

        let sql = this.getPostBaseQuery
        sql+= `
        ) AS news_post
        FROM news_posts p
        INNER JOIN users u ON
        p.posted_by = u.id
        LEFT JOIN reported_news_posts rnp ON
        p.id = rnp.news_post AND
        rnp.reported_by = ?
        WHERE p.id = ? AND p.is_active = ? AND u.is_active = ? AND rnp.news_post IS NULL
        `

        const [rows, _] = await db.execute(sql, 
            [true, true, !userId ? 0 : userId, true, !userId ? 0 : userId, true, true, true, true, !userId ? 0 : userId, postId, true, true])
        if(rows.length === 0) {
            return false;
        }
        const post = rows[0].news_post
        return post
    }

    static async updateById({toBeUpdatedFields, postId}) {
     
        const dateTime = getCurrentDateTime()

        let query = 'UPDATE news_posts SET ';
        let values = [];
        let i = 0;
       
        for (const field in toBeUpdatedFields) {
            // For first field, we do not wanna add comma in the query
            if (i > 0) {
                query += ', ';
            }
            query += field + ' = ?';
            values.push(toBeUpdatedFields[field]);
            i++;
        }

        query += ', updated_at = ?'
        query += ' WHERE id = ?';
        query += ' AND is_active = ?';
        console.log(query);
        values.push(dateTime, postId, true)
        await db.execute(query, values)
        // THE QUERY AND ITS VALUES WILL BE
        // UPDATE news_posts SET body = ?, updated_at = ? WHERE id = ? AND is_active = ?
        // [ 'Good team of England.', '2023-06-16 07:23:01', '15', true ]
    }

    // POST's status will be set to in_active
    static async deletePost({postId}) {
        const postSql = `DELETE FROM news_posts WHERE id = ?`
        await db.execute(postSql, [postId])
    }

    static async togglePostSave({postId, userId}) {
        const dateTime = getCurrentDateTime()

        const findSql = `SELECT COUNT(*) AS COUNT FROM news_posts_saves ps
        INNER JOIN users u on u.id = ps.saved_by AND u.is_active = ?
        WHERE
        ps.news_post = ? AND ps.saved_by = ?
        `
        const [count, _] = await db.execute(findSql, [true, postId, userId])
        
        const totalCount = count[0].COUNT;
        // IF USER HAS ALREADY SAVED THE POST, DELETE THE ROW
        if(totalCount === 1 || totalCount >= 1) {
            const deleteSql = `
            DELETE ps
            FROM news_posts_saves ps
            INNER JOIN users u ON ps.saved_by = u.id
            WHERE ps.news_post = ? 
            AND ps.saved_by = ?
            AND u.is_active = ?
            `
            await db.execute(deleteSql, [postId, userId, true])
            
        }
        // ELSE INSERT THE ROW
        else {  
            const insertSql = 
            `
            INSERT INTO news_posts_saves (
                news_post,
                saved_by,
                created_at,
                updated_at
               
            )
            VALUES (?, ?, ?, ?)
            `
            await db.execute(insertSql, [postId, userId, dateTime, dateTime])
        }
    }

    static async insertNewsPostComment({userId}) {
        const dateTime = getCurrentDateTime()
        const sql = `INSERT INTO news_posts(
            title,
            content, 
            posted_by,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?)`
        
        await db.execute(sql, [
            this.title, 
            this.content, 
            this.posted_by,
            dateTime, 
            dateTime
        ])
    }

    // COALESCE WILL RETURN EMPTY ARRAY WHEN SUB QUERY RETURNS 0 ROWS
    static getPostBaseQuery = `
    SELECT JSON_OBJECT(
        'id', p.id,
        'title', p.title,
        'content', p.content,
        'created_at', p.created_at,
        'updated_at', p.updated_at,
        'is_active', p.is_active,
        'images', COALESCE(
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', pi.id,
                        'url', pi.image
                    )
                )
                FROM news_posts_images pi
                WHERE pi.news_post = p.id
            ),
            JSON_ARRAY()
        ),
        'likes_count', (
            SELECT COUNT(*)
            FROM news_posts_likes pl
            INNER JOIN users u ON pl.liked_by = u.id AND u.is_active = ?
            WHERE pl.news_post = p.id
        ),
        'is_liked', (
            SELECT CASE WHEN EXISTS (
                SELECT 1
                FROM news_posts_likes pl
                INNER JOIN users u ON pl.liked_by = u.id AND u.is_active = ?
                WHERE pl.news_post = p.id AND pl.liked_by = ? 
            ) THEN 1 ELSE 0 END
        ),
        'is_saved', (
            SELECT CASE WHEN EXISTS (
                SELECT 1
                FROM news_posts_saves ps
                INNER JOIN users u ON ps.saved_by = u.id AND u.is_active = ?
                WHERE ps.news_post = p.id AND ps.saved_by = ?
            ) THEN 1 ELSE 0 END
        ),
        'posted_by', ( 
            SELECT JSON_OBJECT(
                'id', u.id,
                'username', u.username,
                'profile_picture', u.profile_picture,
                'user_type', u.user_type
            )
            FROM users u
            WHERE u.id = p.posted_by AND u.is_active = ?
        ),
        'comment_count', (
            SELECT COUNT(*)
            FROM news_posts_comments pc
            INNER JOIN users u ON pc.comment_by = u.id AND u.is_active = ?
            WHERE pc.news_post = p.id
        ),
        'likes', (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', li.id,
                    'created_at', li.created_at,
                    'updated_at', li.updated_at,
                    'liked_by', (
                        SELECT JSON_OBJECT (
                            'id', u.id,
                            'username', u.username,
                            'profile_picture', u.profile_picture,
                            'user_type', u.user_type
                        )
                        FROM users u
                        WHERE u.id = li.liked_by AND u.is_active = ?
                    )
                )
            )
            FROM (
                SELECT 
                    pl.id, pl.created_at, pl.updated_at, pl.liked_by
                FROM news_posts_likes pl
                INNER JOIN users u ON pl.liked_by = u.id AND u.is_active = ?
                WHERE pl.news_post = p.id
                ORDER BY pl.updated_at DESC 
                LIMIT 4
            ) AS li 
        )
    `
}

module.exports = NewsPosts
