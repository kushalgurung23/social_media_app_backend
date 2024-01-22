const db = require("../config/db");

class Promotions {
    static async findAll({order_by, limit, offset}) {
        const countSql = `
        SELECT COUNT(*) AS total_promotions
        FROM promotions
        `

        const [count, countField] = await db.execute(countSql, []);
        const totalPromotionsCount = count[0].total_promotions;

        let getPromotionsSql = `
            SELECT * FROM promotions
        `
        // IF order_by query string is not selected, api will be sent in desc order
        if (!order_by) {
            getPromotionsSql += " ORDER BY created_at DESC";
        }
        if (order_by) {
            // order_by will accept two values: created_at_asc or created_at_desc
            if (order_by === "created_at_asc") {
                getPromotionsSql += " ORDER BY created_at ASC";
            }
            // IF ANYTHING ELSE EXCEPT created_at_asc is provided, the result will be sent in descending order.
            else {
                getPromotionsSql += " ORDER BY created_at DESC";
            }
        }
        getPromotionsSql += " LIMIT ? OFFSET ?";
        let promotionValues = []
        promotionValues.push(limit.toString(), offset.toString());

        const [promotions, _] = await db.execute(getPromotionsSql, promotionValues)

        if(promotions.length === 0) {
            return {totalPromotionsCount, promotions: false}
        }
        return { totalPromotionsCount, promotions };
    }
}

module.exports = Promotions