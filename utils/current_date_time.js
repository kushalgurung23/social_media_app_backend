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

const formatUtcTime = ({utcDate}) => {
    const year = utcDate.getFullYear()
    const month = utcDate.getMonth()+1
    const day = utcDate.getDate()
    const hour = utcDate.getHours()
    const minute = utcDate.getMinutes()
    const seconds = utcDate.getSeconds()

    const createdAtDate = `${year}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day} ${hour < 10 ? `0${hour}` : hour}:${minute < 10 ? `0${minute}` : minute}:${seconds < 10 ? `0${seconds}` : seconds}`
    console.log(createdAtDate);
    return createdAtDate
}

module.exports = {getCurrentDateTime, formatUtcTime}