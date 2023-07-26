const db = require('../config/db')
const {getCurrentDateTime} = require('../utils')

class Post {
    constructor({
        title, 
        body,
        created_by,
        rent_type, 
        address, 
        initial_price, 
        monthly_price, 
        number_of_rooms, 
        has_wifi,
        has_bike_parking,
        has_car_parking,
        has_hot_water,
        has_bathroom,
        has_toilet
    }) {
        this.title = title
        this.body = body
        this.created_by = created_by
        this.rent_type = rent_type
        this.address = address
        this.initial_price = initial_price
        this.monthly_price = monthly_price
        this.number_of_rooms = number_of_rooms
        this.has_wifi = has_wifi
        this.has_bike_parking = has_bike_parking
        this.has_car_parking = has_car_parking
        this.has_hot_water = has_hot_water
        this.has_bathroom = has_bathroom
        this.has_toilet = has_toilet
    }

    async save() {
       const dateTime = getCurrentDateTime()
    
        const sql = `INSERT INTO posts(
            title,
            body, 
            created_at,
            updated_at,
            is_active,
            created_by,
            rent_type,
            address,
            initial_price,
            monthly_price,
            number_of_rooms,
            has_wifi,
            has_bike_parking,
            has_car_parking,
            has_hot_water, 
            has_bathroom,
            has_toilet
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        
        const [result] = await db.execute(sql, [
            this.title, 
            this.body, 
            dateTime, 
            dateTime, 
            true,
            this.created_by,
            this.rent_type,
            this.address,
            this.initial_price,
            this.monthly_price,
            this.number_of_rooms,
            this.has_wifi,
            this.has_bike_parking,
            this.has_car_parking,
            this.has_hot_water,
            this.has_bathroom,
            this.has_toilet
        ])
        return(result.insertId);
    }

    static async findAll({offset, limit, search, order_by, userId}) {
        // TOTAL COUNT
        let countSql = `
        SELECT COUNT(*) AS total_posts FROM posts p
        INNER JOIN users u on p.created_by = u.id 
        WHERE p.is_active = ? AND u.is_active = ?`
        let countValues = [true, true]
        if(search) {
            countSql+= ` AND title LIKE ?`
            countValues.push(`%${search}%`)
        }
       
        const [count, countField] = await db.execute(countSql, countValues)
        const totalPostsCount = count[0].total_posts
        
        // COALESCE WILL RETURN EMPTY ARRAY WHEN SUB QUERY RETURNS 0 ROWS
        let postsSql = `SELECT JSON_OBJECT(
            'id', p.id,
            'title', p.title,
            'body', p.body,
            'created_at', p.created_at,
            'updated_at', p.updated_at,
            'is_active', p.is_active,
            'rent_type', p.rent_type,
            'address', p.address,
            'initial_price', p.initial_price,
            'monthly_price', p.monthly_price,
            'number_of_rooms', p.number_of_rooms,
            'has_wifi', p.has_wifi,
            'has_bike_parking', p.has_bike_parking,
            'has_car_parking', p.has_car_parking,
            'has_hot_water', p.has_hot_water,
            'has_bathroom', p.has_bathroom,
            'has_toilet', p.has_toilet,
            'images', COALESCE(
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', pi.id,
                            'url', pi.image
                        )
                    )
                    FROM posts_images pi
                    WHERE pi.post_id = p.id AND pi.is_active = ?
                ),
                JSON_ARRAY()
            ),
            'likes_count', (
                SELECT COUNT(*)
                FROM posts_likes pl
                INNER JOIN users u ON pl.liked_by = u.id AND u.is_active = ?
                WHERE pl.post_id = p.id AND pl.is_active = ?
            ),
            'is_liked', (
                SELECT CASE WHEN EXISTS (
                    SELECT 1
                    FROM posts_likes pl
                    INNER JOIN users u ON pl.liked_by = u.id AND u.is_active = ?
                    WHERE pl.post_id = p.id AND pl.liked_by = ? AND pl.is_active = ?
                ) THEN 1 ELSE 0 END
            ),
            'created_by', (
                SELECT JSON_OBJECT(
                    'id', u.id,
                    'name', u.name,
                    'profile_picture', u.profile_picture
                )
                FROM users u 
                WHERE p.created_by = u.id AND u.is_active = ?
            )
        ) AS post
        FROM posts p 
        INNER JOIN users u ON
        p.created_by = u.id
        WHERE p.is_active = ? AND u.is_active = ?`
       
        let postsValues = [true, true, true, true, !userId ? 0 : userId, true, true, true, true]
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

    static async findById(id) {
        const sql = `
        SELECT id FROM posts p
        INNER JOIN users u ON
        p.created_by = u.id
        WHERE p.is_active = ? 
        AND p.id = ?
        AND u.is_active = ?
        `
        const [post, _] = await db.execute(sql, [true, id, true])
        return post[0]
    }

    // WHEN WE WANT TO SEE DETAILS OF ONLY ONE POST
    static async getOnePost({postId, userId}) {

        const sql = `
        SELECT JSON_OBJECT(
            'id', p.id,
            'title', p.title,
            'body', p.body,
            'created_at', p.created_at,
            'updated_at', p.updated_at,
            'is_active', p.is_active,
            'rent_type', p.rent_type,
            'address', p.address,
            'initial_price', p.initial_price,
            'monthly_price', p.monthly_price,
            'number_of_rooms', p.number_of_rooms,
            'has_wifi', p.has_wifi,
            'has_bike_parking', p.has_bike_parking,
            'has_car_parking', p.has_car_parking,
            'has_hot_water', p.has_hot_water,
            'has_bathroom', p.has_bathroom,
            'has_toilet', p.has_toilet,
            'images', COALESCE(
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', pi.id,
                            'url', pi.image
                        )
                    )
                    FROM posts_images pi
                    WHERE pi.post_id = p.id AND pi.is_active = ?
                ),
                JSON_ARRAY()
            ),
            'likes_count', (
                SELECT COUNT(*)
                FROM posts_likes pl
                INNER JOIN users u ON pl.liked_by = u.id AND u.is_active = ?
                WHERE pl.post_id = p.id AND pl.is_active = ?
            ),
            'is_liked', (
                SELECT CASE WHEN EXISTS (
                    SELECT 1
                    FROM posts_likes pl
                    INNER JOIN users u ON pl.liked_by = u.id AND u.is_active = ?
                    WHERE pl.post_id = p.id AND pl.liked_by = ? AND pl.is_active = ?
                ) THEN 1 ELSE 0 END
            ),
            'created_by', (
                SELECT JSON_OBJECT(
                    'id', u.id,
                    'name', u.name,
                    'profile_picture', u.profile_picture
                )
                FROM users u
                WHERE u.id = p.created_by AND u.is_active = ?
            )
        ) AS result
        FROM posts p
        INNER JOIN users u ON
        p.created_by = u.id
        WHERE p.id = ? AND p.is_active = ? AND u.is_active = ?
        `

        const [rows, _] = await db.execute(sql, 
            [true, true, true, true, !userId ? 0 : userId, true, true, postId, true, true])
        if(rows.length === 0) {
            return false;
        }
        const post = rows[0].result
        return post
    }

    static async updateById({toBeUpdatedFields, postId}) {
     
        const dateTime = getCurrentDateTime()

        let query = 'UPDATE posts SET ';
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
        values.push(dateTime, postId, true)
        await db.execute(query, values)
        // THE QUERY AND ITS VALUES WILL BE
        // UPDATE posts SET body = ?, updated_at = ? WHERE id = ? AND is_active = ?
        // [ 'Good team of England.', '2023-06-16 07:23:01', '15', true ]
    }

    // POST's status will be set to in_active
    static async deletePost({postId}) {
        const dateTime = getCurrentDateTime()
        const values = [false, dateTime, postId, true]
        // REMOVE post
        const postSql = `UPDATE posts SET is_active = ?, updated_at = ? WHERE id = ? AND is_active = ?`
        await db.execute(postSql, values)
        
        // REMOVE post's images
        const postImageSql = `UPDATE posts_images SET is_active = ?, updated_at = ? WHERE post_id = ? AND is_active = ?`
        await db.execute(postImageSql, values)
    }

    static async togglePostLike({postId, userId}) {
        const dateTime = getCurrentDateTime()

        const findSql = `SELECT COUNT(*) AS COUNT FROM posts_likes pl
        INNER JOIN users u on u.id = pl.liked_by AND u.is_active = ?
        WHERE
        pl.post_id = ? AND pl.liked_by = ? AND pl.is_active = ?
        `
        const [count, _] = await db.execute(findSql, [true, postId, userId, true])
        
        const totalCount = count[0].COUNT;
        // IF USER HAS ALREADY LIKED THE POST, DELETE THE ROW
        if(totalCount === 1 || totalCount >= 1) {

            const deleteSql = `
            DELETE pl
            FROM posts_likes pl 
            INNER JOIN users u ON pl.liked_by = u.id
            WHERE pl.post_id = ? 
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
            INSERT INTO posts_likes (
                post_id,
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

    static async togglePostSave({postId, userId}) {
        const dateTime = getCurrentDateTime()

        const findSql = `SELECT COUNT(*) AS COUNT FROM posts_saves ps
        INNER JOIN users u on u.id = ps.saved_by AND u.is_active = ?
        WHERE
        ps.post_id = ? AND ps.saved_by = ? AND ps.is_active = ?
        `
        const [count, _] = await db.execute(findSql, [true, postId, userId, true])
        
        const totalCount = count[0].COUNT;
        // IF USER HAS ALREADY SAVED THE POST, DELETE THE ROW
        if(totalCount === 1 || totalCount >= 1) {
            const deleteSql = `
            DELETE ps
            FROM posts_saves ps
            INNER JOIN users u ON ps.saved_by = u.id
            WHERE ps.post_id = ? 
            AND ps.saved_by = ?
            AND ps.is_active = ?
            AND u.is_active = ?
            `
            await db.execute(deleteSql, [postId, userId, true, true])
            
        }
        // ELSE INSERT THE ROW
        else {  
            const insertSql = 
            `
            INSERT INTO posts_saves (
                post_id,
                saved_by,
                created_at,
                updated_at,
                is_active
            )
            VALUES (?, ?, ?, ?, ?)
            `
            await db.execute(insertSql, [postId, userId, dateTime, dateTime, true])
        }
    }
}

module.exports = Post
