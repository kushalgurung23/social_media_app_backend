const db = require('../config/db')
const {getCurrentDateTime} = require('../utils')

class Services {
  static async findAll({ offset, limit, search, order_by, userId, is_recommend, category }) {
    // TOTAL COUNT
    let countSql = `
        SELECT COUNT(*) AS total_services
        FROM services`;
    let countValues = [];
    if(search || is_recommend === '1' || category) {
        countSql += ` WHERE`
    }
    if (search) {
      countSql += ` title LIKE ?`;
      countValues.push(`%${search}%`);
    }
    if(search && (is_recommend === '1' || category)) {
        countSql += ` AND`
    }
    if(is_recommend === '1') {
        countSql += ` is_recommend = ?`
        countValues.push(true)
    }
    if((search || is_recommend === '1') && category) {
        countSql += ` AND`
    }
    if(category) {
        countSql += ` category LIKE ?`;
        countValues.push(category)
    }
    

    const [count, countField] = await db.execute(countSql, countValues);
    const totalServicesCount = count[0].total_services;

    let getServicesSql = this.getServicesBaseQuery;
    getServicesSql += `
        ) AS service
                FROM services s
        `;
    console.log(countSql);
    let servicesValues = [true, !userId ? 0 : userId];

    if(search || is_recommend === '1' || category) {
        console.log('a');
        getServicesSql += ` WHERE`
    }
    if (search) {
        console.log('b');
        getServicesSql += ` s.title LIKE ?`;
        servicesValues.push(`%${search}%`);
    }
    if(search && (is_recommend === '1' || category)) {
        console.log('c');
        getServicesSql += ` AND`
    }
    if(is_recommend === '1') {
      console.log("d");
      getServicesSql += ` s.is_recommend = ?`;
      servicesValues.push(true);
    }
    if((search || is_recommend === '1') && category) {
        console.log('e');
        getServicesSql += ` AND`;
    }
    if(category) {
        console.log('f');
        getServicesSql += ` s.category LIKE ?`
        servicesValues.push(category)
    }

    getServicesSql += " GROUP BY s.id";
    // IF order_by query string is not selected, api will be sent in desc order
    if (!order_by) {
      getServicesSql += " ORDER BY s.created_at DESC";
    }
    if (order_by) {
      // order_by will accept two values: created_at_asc or created_at_desc
      if (order_by === "created_at_asc") {
        getServicesSql += " ORDER BY s.created_at ASC";
      }
      // IF ANYTHING ELSE EXCEPT created_at_asc is provided, the result will be sent in descending order.
      else {
        getServicesSql += " ORDER BY s.created_at DESC";
      }
    }
    getServicesSql += " LIMIT ? OFFSET ?";
    servicesValues.push(limit.toString(), offset.toString());
    const [services, _] = await db.execute(getServicesSql, servicesValues);

    if (services.length === 0) {
      return { totalServicesCount, services: false };
    }

    return { totalServicesCount, services };
  }

  static async checkById(id) {
    const sql = `
        SELECT id FROM services
        WHERE id = ?
        `;
    const [service, _] = await db.execute(sql, [id]);
    return service[0];
  }
  // WHEN WE WANT TO SEE DETAILS OF ONLY ONE SERVICE
  static async getOneService({ serviceId, userId }) {
    let sql = this.getServicesBaseQuery;
    sql += `
        ) AS service
        FROM services s 
        WHERE s.id = ?
        `;
    const [rows, _] = await db.execute(sql, [
      true,
      !userId ? 0 : userId,
      serviceId,
    ]);
    if (rows.length === 0) {
      return false;
    }
    const service = rows[0].service;
    return service;
  }

  static async toggleServiceSave({ serviceId, userId }) {
    const dateTime = getCurrentDateTime();

    const findSql = `SELECT COUNT(*) AS COUNT FROM service_saves ss
        INNER JOIN users u on u.id = ss.saved_by
        WHERE
        ss.service_id = ? AND ss.saved_by = ?
        `;
    const [count, _] = await db.execute(findSql, [serviceId, userId]);

    const totalCount = count[0].COUNT;
    // IF USER HAS ALREADY SAVED THE SERVICE, DELETE THE ROW
    if (totalCount === 1 || totalCount >= 1) {
      const deleteSql = `
            DELETE ss
            FROM service_saves ss
            INNER JOIN users u ON ss.saved_by = u.id
            WHERE ss.service_id = ? 
            AND ss.saved_by = ?
            AND u.is_active = ?
            `;
      await db.execute(deleteSql, [serviceId, userId, true]);
    }
    // ELSE INSERT THE ROW
    else {
      const insertSql = `
            INSERT INTO service_saves (
                service_id,
                saved_by,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?)
            `;
      await db.execute(insertSql, [serviceId, userId, dateTime, dateTime]);
    }
  }

  static async getSavedServices({ offset, limit, order_by, userId }) {
    // TOTAL COUNT
    let countSql = `
    SELECT COUNT(*) AS total_services FROM services s
    INNER JOIN service_saves ss ON s.id = ss.service_id
    WHERE ss.saved_by = ?
    `;
    const [count, countField] = await db.execute(countSql, [userId])
    const totalServicesCount = count[0].total_services

    let getServicesSql = this.getServicesBaseQuery
    getServicesSql += `
        ) AS service
        FROM services s
        INNER JOIN service_saves ss ON s.id = ss.service_id
        WHERE ss.saved_by = ?
    `

    let servicesValues = [true, !userId ? 0 : userId, !userId ? 0 : userId]

    getServicesSql += ' GROUP BY ss.id';
    // IF order_by query string is not selected, api will be sent in desc order
    if (!order_by) {
        getServicesSql += " ORDER BY ss.created_at DESC";
    }
    if (order_by) {
        // order_by will accept two values: created_at_asc or created_at_desc
        if (order_by === "created_at_asc") {
          getServicesSql += " ORDER BY ss.created_at ASC";
        }
        // IF ANYTHING ELSE EXCEPT created_at_asc is provided, the result will be sent in descending order.
        else {
          getServicesSql += " ORDER BY ss.created_at DESC";
        }
    }

    getServicesSql += " LIMIT ? OFFSET ?";
    servicesValues.push(limit.toString(), offset.toString());
    const [services, _] = await db.execute(getServicesSql, servicesValues);

    if(services.length === 0) {
        return {
            totalServicesCount, services: false
        }
    }
    return { totalServicesCount, services };
  }

  static async getServicesCategories() {
    // TOTAL COUNT
    const countSql = `
        SELECT count(*) AS total_categories
        FROM service_categories
    `
    const [count, countField] = await db.execute(countSql, [])
    const totalCategoriesCount = count[0].service_categories;

    const getServicesSql = `
        SELECT * FROM service_categories ORDER BY created_at DESC
    `
    const [categories, _] = await db.execute(getServicesSql, [])
    if(categories.length === 0) {
        return {totalCategoriesCount, categories: false}
    }
    return {totalCategoriesCount, categories}
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
        'service_images', COALESCE(
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', si.id,
                        'url', si.image
                    )
                )
                FROM service_images si
                WHERE si.service_id = s.id
            ),
            JSON_ARRAY()
        ),
        'is_saved', (
            SELECT CASE WHEN EXISTS (
                SELECT 1
                FROM service_saves ss
                INNER JOIN users u ON ss.saved_by = u.id AND u.is_active = ?
                WHERE ss.service_id = s.id AND ss.saved_by = ? 
            ) THEN 1 ELSE 0 END
        )  
    `;
}



module.exports = Services
