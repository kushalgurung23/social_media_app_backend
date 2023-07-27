const db = require('../config/db')
const {getCurrentDateTime} = require('../utils')

class Token {

    static async deleteAllExpiredTokens({userId}) {
        const sql = `
        DELETE FROM tokens
        WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
        AND user = ?;
        `
        await db.execute(sql, [userId])
    }

    static async findByRefreshToken({refresh_token, userId}) {
        const sql = `SELECT * FROM tokens WHERE refresh_token = ? AND user = ?`
        const [token, _] = await db.execute(sql, [refresh_token, userId])
        return token[0]
    }

    static async findByAccessToken({access_token, userId}) {
        const sql = `SELECT * FROM tokens WHERE access_token = ? AND user = ?`
        const [token, _] = await db.execute(sql, [access_token, userId])
        return token[0]
    }

    static async createToken({access_token, refresh_token, user}) {
        const dateTime = getCurrentDateTime()
        const sql = `INSERT INTO tokens(
            access_token,
            refresh_token,
            user,
            created_at,
            updated_at,
            is_active
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `
        await db.execute(sql, [access_token, refresh_token, user, dateTime, dateTime, true])
    }

    static async deleteWithRefreshToken({refresh_token}) {
        const sql = 
        `
            DELETE FROM tokens WHERE refresh_token = ?
        `
        await db.execute(sql, [refresh_token])
    }

    static async updateNewAccessToken({access_token, userId, tokenId}) {
        const sql = 
        `
            UPDATE tokens SET access_token = ?, updated_at = ? WHERE user = ? AND id = ?
        `
        await db.execute(sql, [access_token, getCurrentDateTime(), userId, tokenId])
    }
}

module.exports = Token