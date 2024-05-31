const { getAllUsers } = require('../databases/mssql');

async function testGetAllUsers() {
    const users = await getAllUsers();
    console.log('All Users:', users);
}

testGetAllUsers();