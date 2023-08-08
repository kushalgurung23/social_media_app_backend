const db = require('../config/db')
const { use } = require('../routes/postRoutes')
const getCurrentDateTime = require('../utils/current_date_time')

class User {
    constructor({username, email, password, userType, verificationToken, verificationTokenExpirationDate}) {
        this.username = username,
        this.email = email,
        this.password = password,
        this.userType = userType,
        this.verificationToken = verificationToken,
        this.verificationTokenExpirationDate = verificationTokenExpirationDate
    }

    async save() {
        const dateTime = getCurrentDateTime()
        const sql = `INSERT INTO users(
            username,
            email, 
            password,
            user_type,
            verification_token,
            created_at,
            updated_at,
            is_active,
            verification_token_expiration_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        await db.execute(sql, [this.username, this.email, this.password, this.userType, this.verificationToken, dateTime, dateTime, true, this.verificationTokenExpirationDate]
        )
    }

    static async findUserById({userId}) {
        const sql = `SELECT * FROM users WHERE id = ? AND is_active = ?`
        const [user, _] = await db.execute(sql, [userId, true])
        return user[0]
    }

    static async findUserByEmail({email}) {
        const sql = `SELECT * FROM users WHERE email = ? AND is_active = ?`
        const [user, _] = await db.execute(sql, [email, true])
        return user[0]
    }

    // after correct 6 digit is entered by user
    static async confirmEmailVerification({email}) {
        const dateTime = getCurrentDateTime()
        const sql = `
        UPDATE users set verification_token = ?, verification_token_expiration_date = ?, is_verified = ?, verified_on = ?, updated_at = ? WHERE email = ? AND is_active = ?
        `
        await db.execute(sql, [null, null, true, dateTime, dateTime, email, true])
    }

    // if user wants another verification token for registration
    static async updateVerificationToken({newToken, email, verificationTokenExpirationDate}) {
        const dateTime = getCurrentDateTime()
        const sql = `
        UPDATE users set verification_token = ?, updated_at = ?, verification_token_expiration_date = ? WHERE email = ? AND is_active = ?
        `
        await db.execute(sql, [newToken, dateTime, verificationTokenExpirationDate, email, true])
    }

    // if user has forgotten the password
    static async updateForgotPasswordToken({passwordForgotToken, passwordForgotTokenExpirationDate, email}) {
        const dateTime = getCurrentDateTime()
        const sql = `
        UPDATE users set password_forgot_token = ?, password_forgot_token_expiration_date = ?, is_password_forgot_token_verified = ?, updated_at = ? WHERE email = ? AND is_active = ?
        `
        await db.execute(sql, [passwordForgotToken, passwordForgotTokenExpirationDate, false, dateTime, email, true])
    }

    // WHEN USER PROVIDES CORRECT 6 DIGIT PASSWORD FORGOT CODE
    static async verifyForgotPasswordToken({email}) {
        const dateTime = getCurrentDateTime()
        const sql = `
        UPDATE users set is_password_forgot_token_verified = ?, updated_at = ? WHERE email = ? AND is_active = ?
        `
        await db.execute(sql, [true, dateTime, email, true])
    }

    // if user has successfully provided new password
    static async resetPassword({hashPassword, email}) {
        const dateTime = getCurrentDateTime()
        const sql = `
        UPDATE users set password = ?, password_forgot_token = ?, password_forgot_token_expiration_date = ?, is_password_forgot_token_verified = ?, updated_at = ? WHERE email = ? AND is_active = ?
        `
        await db.execute(sql, [hashPassword, null, null, null, dateTime, email, true])
    }

    static async getMyDetails({userId}) {
        const sql = `SELECT id, name, email, role, profile_picture, is_verified, verified_on, created_at, updated_at, is_active FROM users WHERE id = ? AND is_active = ?`
        const [user, _] = await db.execute(sql, [userId, true])
        return user[0]
    }

    static async editProfilePicture({profilePicture, userId}) {
        const dateTime = getCurrentDateTime()
        const sql = `
        UPDATE users set profile_picture = ?, updated_at = ? WHERE id = ? AND is_active = ?
        `
        await db.execute(sql, [profilePicture, dateTime, userId, true])
    }

    static async editUserDetails({toBeUpdatedFields, userId}) {
     
        const dateTime = getCurrentDateTime()

        let query = 'UPDATE users SET ';
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
        values.push(dateTime, userId, true)
        
        await db.execute(query, values)
        // THE QUERY AND ITS VALUES WILL BE
        // UPDATE users SET name = ?, updated_at = ? WHERE id = ? AND is_active = ?
        // [ 'golden', '2023-06-16 09:35:11', 28, true ]
    }

    static async editProfilePicture({profilePicture, userId}) {
        const dateTime = getCurrentDateTime()
        const sql = `
        UPDATE users set profile_picture = ?, updated_at = ? WHERE id = ? AND is_active = ?
        `
        await db.execute(sql, [profilePicture, dateTime, userId, true])
    }

    static async deleteUserAccount({userId}) {
        const sql = `DELETE FROM users where id = ?`
        await db.execute(sql, [userId])
    }

}

module.exports = User