const db = require("../config/db");
const { getCurrentDateTime } = require("../utils");

class PushNotification {
    static async findAll({userId, offset, limit, order_by}) {
        // TOTAL COUNT
        const countSql = `
            SELECT COUNT(*) AS total_notifications
            FROM push_notifications WHERE receiver = ?
        `
        const countValues = [userId]

        const [count, countField] = await db.execute(countSql, countValues);
        const totalNotificationsCount = count[0].total_notifications;

        let getNotificationsSql = `
            SELECT JSON_OBJECT(
                'id', pn.id,
                'category', pn.category,
                'is_read', pn.is_read,
                'created_at', pn.created_at,
                'updated_at', pn.updated_at,
                'sender', (
                    SELECT JSON_OBJECT (
                        'id', u.id,
                        'username', u.username,
                        'profile_picture', u.profile_picture,
                        'user_type', u.user_type
                    )
                    FROM users u
                    WHERE u.id = pn.sender AND u.is_active = ?
                )
            ) AS notification
            FROM push_notifications pn WHERE receiver = ?
        `

        let notificationValues = [true, userId]

        if(!order_by) {
            getNotificationsSql += ` ORDER BY created_at DESC`
        }
        if(order_by) {
            if(order_by === "created_at_asc") {
                getNotificationsSql += ' ORDER BY created_at ASC'
            }
            else {
                getNotificationsSql += ' ORDER BY created_at DESC'
            }
        }

        getNotificationsSql += ' LIMIT ? OFFSET ?'
        notificationValues.push(limit.toString(), offset.toString())

        const [notifications, _]  = await db.execute(getNotificationsSql, notificationValues);

        if(notifications.length === 0) {
            return {totalNotificationsCount, notifications: false}
        }
        const formattedNotification = notifications.map(({notification}) => notification)
        return {totalNotificationsCount, notifications: formattedNotification};
    }

    static async readNotification({userId, notificationId}) {
        const dateTime = getCurrentDateTime()
        const sql = `
            UPDATE push_notifications SET is_read = ?, updated_at = ? WHERE id = ? AND receiver = ?
        `
        const sqlValues = [1, dateTime, notificationId, userId]
        console.log(sqlValues);
        const [notification, _] = await db.execute(sql, sqlValues)
       
        if(notification.affectedRows < 1) {
            return false;
        }
        return true;
    }
}

module.exports = PushNotification