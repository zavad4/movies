const Sequelize = require('sequelize');
const uuid = require('uuid');

const models = require('./models.js')
const config = require('../config.js');
const {postgre} = require('../config.js');
const sequelize = new Sequelize(postgre.database, postgre.user, postgre.password, {
    host: postgre.host,
    dialect: 'postgres',
    ssl: true,
    dialectOptions: {
        "ssl": {"rejectUnauthorized": false}
      }
});

const Movies = sequelize.define('Movies', models.Movies);
const Actors = sequelize.define('Actors', models.Actors);
const Users = sequelize.define('Users', models.Users);

async function connectToDB() {
    try {
        await sequelize.authenticate()
        console.log('Connected to DB')
      } catch (e) {
        console.log('Impossible to connect', e)
    }
}

(async () => {
    await connectToDB();
})();

module.exports = {
    Movies,
    Actors,
    Users,
};