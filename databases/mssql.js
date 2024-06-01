const sql = require('mssql');
// Envionment variables:
const dotenv = require('dotenv');
dotenv.config();

const config = {
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE,
    options: {
        encrypt: true, // If you're on Windows Azure
        trustServerCertificate: true
    }
};

const connectToMSSQL = async () => {
    try {
        await sql.connect(config);
        console.log('Connected to MSSQL');
    } catch (error) {
        console.error('Error connecting to MSSQL:', error);
    }
};

async function getMovies() {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT * FROM [db_exam].[dbo].[Movie_Genre_View]`;
        return result.recordset.map(movie => ({
            id: movie.movie_id,
            primary_title: movie.primary_title,
            original_title: movie.original_title,
            duration: movie.duration,
            rating: movie.rating,
            release_date: movie.release_date,
            plot_summary: movie.plot_summary,
            plot_synopsis: movie.plot_synopsis,
            genres: movie.genres,
            reviews: []
        }));
    } catch (err) {
        console.error('Error fetching movies:', err);
        return [];
    } finally {
        sql.close();
    }
};

async function createMovie(movie) {
    try {
        await sql.connect(config);
        const genres = movie.genres.join(',');

        const result = await sql.query`
            EXEC dbo.CreateMovie 
                @movie_id = ${movie.id},
                @primary_title = ${movie.primary_title},
                @original_title = ${movie.original_title},
                @duration = ${movie.duration},
                @rating = ${movie.rating},
                @release_date = ${movie.release_date},
                @plot_summary = ${movie.plot_summary},
                @plot_synopsis = ${movie.plot_synopsis},
                @genres = ${genres}`;
                
        return { success: true };
    } catch (err) {
        console.error('Error creating movie:', err);
        return { success: false, message: 'Something went wrong' };
    } finally {
        await sql.close();
    }
}


async function getUsers() {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT [user_id]
        ,[username]
        ,[role_name]
        FROM [db_exam].[dbo].[User_Role_View]`;

        return result.recordset.map(user => ({
            user_id: user.user_id,
            username: user.username,
            roleName: user.role_name
        }));
    } catch (err) {
        //console.error('Error fetching user:', err);
        return null;
    } finally {
        sql.close();
    }
}

async function getUserById(userId) {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT [user_id]
        ,[username]
        ,[email]
        ,[first_name]
        ,[last_name]
        ,[payment_details]
        ,[role_name]
        FROM [db_exam].[dbo].[User_Role_View] WHERE user_id = ${userId}`;

        const user = result.recordset[0];
        if (user) {
            return {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                paymentDetails: user.payment_details,
                roleName: user.role_name
            };
        } else {
            return null;
        }
    } catch (err) {
        //console.error('Error fetching user:', err);
        return null;
    } finally {
        sql.close();
    }
}

async function loginUser(username, password) {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT [user_id]
        ,[username]
        ,[email]
        ,[first_name]
        ,[last_name]
        ,[payment_details]
        ,[role_name]
        FROM [db_exam].[dbo].[User_Role_View] 
        WHERE username = ${username} AND password = ${password}`;

        const user = result.recordset[0];
        if (!user) {
            return { success: false, message: 'Invalid username or password' };
        }

        return {
            success: true,
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                paymentDetails: user.payment_details,
                roleName: user.role_name
            }
        };
    } catch (err) {
        console.error('Error fetching user:', err);
        return { success: false, message: 'Invalid username or password' };
    } finally {
        sql.close();
    }
}

async function updateUser(userId, newRole) {
    try {
        await sql.connect(config);
        const result = await sql.query`
            UPDATE [db_exam].[dbo].[User_Role_View]
            SET role_name = ${newRole}
            WHERE user_id = ${userId}`;

        if (result.rowsAffected[0] === 1) {
            return { success: true, message: 'User role updated successfully' };
        }

        return { success: false, message: 'User not found or no changes made' };
    } catch (err) {
        console.error('Error updating user role:', err);
        return { success: false, message: 'Error updating user role' };
    } finally {
        sql.close();
    }
}

async function searchMovieByTitle(title) {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT * FROM [db_exam].[dbo].[Movie_Genre_View] 
        WHERE primary_title LIKE ${'%' + title + '%'}`;
        return result.recordset.map(movie => ({
            id: movie.movie_id,
            primary_title: movie.primary_title,
            original_title: movie.original_title,
            duration: movie.duration,
            rating: movie.rating,
            release_date: movie.release_date,
            plot_summary: movie.plot_summary,
            plot_synopsis: movie.plot_synopsis,
            genres: movie.genres,
            reviews: []
        }));
    } catch (err) {
        console.error('Error searching for movie by title:', err);
        return [];
    } finally {
        sql.close();
    }
}


module.exports = { connectToMSSQL, getMovies, createMovie, getUserById, loginUser, searchMovieByTitle, getUsers, updateUser };
