const db = require('../config/db')
const {getCurrentDateTime} = require('../utils')

class Services {

    static async findAll({offset, limit, search, order_by, userId}) {
        // TOTAL COUNT
        let countSql = `
        SELECT COUNT(*) AS total_services
        FROM services
        WHERE is_active = ?`
        let countValues = [true]
        if(search) {
            countSql+= ` AND title LIKE ?`
            countValues.push(`%${search}%`)
        }
        const [count, countField] = await db.execute(countSql, countValues)
        const totalServicesCount = count[0].total_services
        
        let getServicesSql = this.getServicesBaseQuery
        getServicesSql+= 
        `
        ) AS service
                FROM services s 
            WHERE s.is_active = ?
        `
       
        let servicesValues = [true, true, !userId ? 0 : userId, true, true]
        if(search) {
            getServicesSql+= ` AND s.title LIKE ?`
            servicesValues.push(`%${search}%`)
        }
        getServicesSql+= " GROUP BY s.id"
        // IF order_by query string is not selected, api will be sent in desc order
        if(!order_by) {
            getServicesSql+= " ORDER BY s.created_at DESC"
        }
        if(order_by) {
            // order_by will accept two values: created_at_asc or created_at_desc
            if(order_by === 'created_at_asc') {
                getServicesSql+= " ORDER BY s.created_at ASC"
            }
            // IF ANYTHING ELSE EXCEPT created_at_asc is provided, the result will be sent in descending order.
            else {
                getServicesSql+= " ORDER BY s.created_at DESC"
            }
        }
        getServicesSql+= " LIMIT ? OFFSET ?"
        servicesValues.push(limit.toString(), offset.toString())
        const [services, _] = await db.execute(getServicesSql, servicesValues)
        
        if(services.length === 0) {
            return {totalServicesCount, services:false};
        }
     
        return {totalServicesCount, services}
    }

    static async checkById(id) {
        const sql = `
        SELECT id FROM services
        WHERE is_active = ? 
        AND id = ?
        `
        const [service, _] = await db.execute(sql, [true, id])
        return service[0]
    }

    // WHEN WE WANT TO SEE DETAILS OF ONLY ONE SERVICE
    static async getOneService({serviceId, userId}) {

        let sql = this.getServicesBaseQuery
        sql+= `
        ) AS service
        FROM services s 
        WHERE s.id = ? AND s.is_active = ?
        `
        const [rows, _] = await db.execute(sql, 
            [true, true, !userId ? 0 : userId, true, serviceId, true])
        if(rows.length === 0) {
            return false;
        }
        const service = rows[0].service
        return service
    }

    static async toggleServiceSave({serviceId, userId}) {
        const dateTime = getCurrentDateTime()

        const findSql = `SELECT COUNT(*) AS COUNT FROM service_saves ss
        INNER JOIN users u on u.id = ss.saved_by AND u.is_active = ?
        WHERE
        ss.service_id = ? AND ss.saved_by = ? AND ss.is_active = ?
        `
        const [count, _] = await db.execute(findSql, [true, serviceId, userId, true])
        
        const totalCount = count[0].COUNT;
        // IF USER HAS ALREADY SAVED THE SERVICE, DELETE THE ROW
        if(totalCount === 1 || totalCount >= 1) {
            const deleteSql = `
            DELETE ss
            FROM service_saves ss
            INNER JOIN users u ON ss.saved_by = u.id
            WHERE ss.service_id = ? 
            AND ss.saved_by = ?
            AND ss.is_active = ?
            AND u.is_active = ?
            `
            await db.execute(deleteSql, [serviceId, userId, true, true])
            
        }
        // ELSE INSERT THE ROW
        else {  
            const insertSql = 
            `
            INSERT INTO service_saves (
                service_id,
                saved_by,
                created_at,
                updated_at,
                is_active
            )
            VALUES (?, ?, ?, ?, ?)
            `
            await db.execute(insertSql, [serviceId, userId, dateTime, dateTime, true])
        }
    }

    // COALESCE WILL RETURN EMPTY ARRAY WHEN SUB QUERY RETURNS 0 ROWS
    static getServicesBaseQuery = `
    SELECT JSON_OBJECT(
        'id', s.id,
        'title', s.title,
        'main_image', s.main_image,
        'category', s.category,
        'price', s.price,
        'description', s.description,
        'is_recommend', s.is_recommend,
        'website', s.website,
        'facebook_link', s.facebook_link,
        'instagram_link', s.instagram_link,
        'twitter_link', s.twitter_link,
        'phone_number', s.phone_number,
        'location', s.location,
        'created_at', s.created_at,
        'updated_at', s.updated_at,
        'is_active', s.is_active,
        'service_images', COALESCE(
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', si.id,
                        'url', si.image
                    )
                )
                FROM service_images si
                WHERE si.service_id = s.id AND si.is_active = ?
            ),
            JSON_ARRAY()
        ),
        'is_saved', (
            SELECT CASE WHEN EXISTS (
                SELECT 1
                FROM service_saves ss
                INNER JOIN users u ON ss.saved_by = u.id AND u.is_active = ?
                WHERE ss.service_id = s.id AND ss.saved_by = ? AND ss.is_active = ?
            ) THEN 1 ELSE 0 END
        )  
    `
}

module.exports = Services
