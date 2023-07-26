const getCurrentDateTime = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = date.getMonth()+1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const seconds = date.getSeconds()

    const createdAtDate = `${year}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day} ${hour < 10 ? `0${hour}` : hour}:${minute < 10 ? `0${minute}` : minute}:${seconds < 10 ? `0${seconds}` : seconds}`
    return createdAtDate
}

module.exports = getCurrentDateTime