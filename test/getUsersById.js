const { getUserById } = require('../databases/mssql');

async function getUser() {
    const userId = 'ur0000002';
    const user = await getUserById(userId);
    console.log('User:', user);
    //return user;
    
}

getUser();

module.exports = getUser;

// run: node ./test/getUserById.js in the terminal