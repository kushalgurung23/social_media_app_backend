const bcrypt = require('bcrypt')

  const generateHashPassword = async ({password}) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt)
  }

  const compareHashPassword = async ({userInputPassword, realPassword}) => {
    const isMatch = await bcrypt.compare(userInputPassword, realPassword)
    return isMatch
  }

  module.exports = {generateHashPassword, compareHashPassword}
