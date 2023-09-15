const db = require('../config/db')

class Chat {
    static async findAll({offset, limit, userId}) {
        const countSql = `
        SELECT COUNT(*) AS total_conversations from conversations AS c
        JOIN users AS u ON c.first_user = u.id OR c.second_user = u.id
        WHERE u.id = ?
        `
        const countValues = [!userId? 0 : userId]
        const [count, countField] = await db.execute(countSql, countValues)
        const totalConversationCount = count[0].total_conversations

        let conversationSql = `
        SELECT
        JSON_OBJECT(
            'conversations', JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', c.id,
                    'created_at', c.created_at,
                    'updated_at', c.updated_at,
                    'chat_message', (
                        SELECT JSON_OBJECT(
                            'id', cm.id,
                            'text', cm.text,
                            'sender', (
                                SELECT JSON_OBJECT(
                                    'id', u.id,
                                    'username', u.username,
                                    'profile_picture', u.profile_picture
                                ) FROM users u WHERE u.id = cm.sender
                            ),
                            'receiver', (
                                SELECT JSON_OBJECT(
                                    'id', u.id,
                                    'username', u.username,
                                    'profile_picture', u.profile_picture
                                ) FROM users u WHERE u.id = cm.receiver
                            ),
                            'created_at', cm.created_at,
                            'updated_at', cm.updated_at,
                            'has_receiver_seen', cm.has_receiver_seen
                        )
                        FROM chat_messages cm
                        WHERE cm.conversation_id = c.id
                        ORDER BY cm.updated_at DESC
                        LIMIT 1
                    )
                )
            )
        ) AS result
    FROM (
        SELECT
            c.id,
            c.created_at,
            c.updated_at
        FROM conversations c
        WHERE c.first_user = ? OR c.second_user = ?
        ORDER BY c.updated_at DESC
        LIMIT ? OFFSET ?
    ) AS c
        `
        const [conversations, _] = await db.execute(conversationSql, [!userId ? 0 : userId, !userId ? 0 : userId, limit.toString(), offset.toString()])
        if(conversations.length === 0) {
            return {totalConversationCount, conversations: false}
        }
        return {totalConversationCount, conversations: conversations[0].result.conversations}
    }

    static async findOne({userId, conversationId, limit, offset}) {
        const conversationSql = `
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', c.id,
                'text', c.text,
                'has_receiver_seen', c.has_receiver_seen,
                'created_at', c.created_at,
                'updated_at, c.updated_at,
                'sender', (
                    SELECT JSON_OBJECT(
                        'id', u.id,
                        'username', u.username,
                        'profile_picture', u.profile_picture
                    )
                    FROM users u WHERE u.id = c.sender
                ),
                'receiver', (
                    SELECT JSON_OBJECT (
                        'id', u.id,
                        'username', u.username,
                        'profile_picture', u.profile_picture
                    )
                    FROM users u WHERE u.id = c.receiver
                )
            )
        ) AS result
        FROM chat_messages c
        WHERE c.sender = ? OR c.receiver = ? AND conversation_id = ?
        ORDER BY c.updated_at DESC
        LIMIT ? ORDER ?
        `

        const [result, _] = await db.execute(conversationSql, [!userId ? 0 : userId, !userId ? 0 : userId, !conversationId ? 0 : conversationId, limit.toString(), offset.toString()])
        console.log(result);
    }
}



module.exports = Chat