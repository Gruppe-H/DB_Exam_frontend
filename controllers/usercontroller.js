const { getUserById } = require('../databases/mssql');

async function getUser(userId) {
    const user = await getUserById(userId);
    return user;
}

module.exports = getUser;