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

module.exports = getMovies;
