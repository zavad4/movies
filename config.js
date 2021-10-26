const postgre = {
    database: process.env.DATABASE,
    user: process.env.POSTGRE_USER,
    password: process.env.PASSWORD,
    host: process.env.DB_HOST,
};
const TOKEN_SECRET = process.env.TOKEN_SECRET;
const state = {
    sessions: [],
}
console.log(postgre);
module.exports = {
    postgre,
    TOKEN_SECRET,
    state,
}