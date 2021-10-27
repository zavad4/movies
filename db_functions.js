const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const jwt = require('jsonwebtoken');
const UUID = require('uuid-int');
const generator = UUID(0);


const { Movies, Actors, Users} = require('./db/db.js');
const config = require('./config');

function genToken(data) {
    return jwt.sign(
        {data},
        config.TOKEN_SECRET
        );
}

async function checkEmail(email) {
    const user = await Users.findAll({
        where: {
            email,
        }
    });
    if (!user.length) return true;
}

async function verifyUser(data) {                               // data - {email, password}
    const user = (await Users.findAll({
        where: {
            email: data.email,
        }
    })).map(x => x.dataValues)[0];
    if (user && user.password === data.password) return user;
}

async function createUser(data) {                               // data - {email, name, password}
    return Users.create({
        id: generator.uuid(),
        ...data,
    });
};

async function checkName(name) {
    const actor=  await Actors.findAll({
        where: {
            name,
        }
    });
    if (!actor.length) return true;
}

async function checkTitle(title) {
    const movie=  await Movies.findAll({
        where: {
            title,
        }
    });
    if (!movie.length) return true;
}

async function addActor(name) {
    let actor = {};
    if(await checkName(name)) {
        actor = await Actors.create({id: generator.uuid(),name});
    } else {
        actor = (await Actors.findAll({
            where: {
                name: name
            }
        }))[0];
    }
    return actor.dataValues;
};

async function getActorInfo(id) {
    const actor = (await Actors.findAll({
        where: {
            id: id
        }
    }));
    if(actor[0]) return actor[0].dataValues;
}

async function addMovie(data) {
    const {title, year, format} = data;
    if (title && await checkTitle(title)) {
        const names = data.actors;
        const actorsInfo = await Promise.all(names.map(async (name) => (await addActor(name))));
        data.actors = actorsInfo.map(x => x.id);
        const movie = (await Movies.create({ 
            id: generator.uuid(), 
            ...data,
        })).dataValues;
        movie.actors = actorsInfo;
        return movie;
    }
}

async function deleteMovie(id) {
    return await Movies.destroy({
        where: {
          id: id
        }
    });
}

async function selectMovie(id) {
    const movie = (await Movies.findAll({
        where: {
            id: id
        }
    }))[0];
    if(movie) {
        let response = movie.dataValues;
        response.actors = await Promise.all(response.actors.map(async (actor) => (await getActorInfo(actor))));
        return response;
    }
}

async function updateMovie(id, data) {
    const names = data.actors;
    let actorsInfo = [];
    if(names) {
        actorsInfo = await Promise.all(names.map(async (name) => (await addActor(name))));
        data.actors = actorsInfo.map(x => x.id);
    }
    await Movies.update(data, { 
        where: {
          id,
        }});
    const response = selectMovie(id);
    response.actors = actorsInfo;
    return response;
}

async function findMovie(sortParam = 'id', order = 'ASC', limit = 20, offset = 0) {
    const movies = await Movies.findAll({
        attributes: { exclude: ['actors']},
        order: [[sortParam, order]],
        limit,
        offset,
    });
    return movies.map( x => x.dataValues);
}

async function findMovieByTitle(title, sortParam = 'id', order = 'ASC', limit = 20, offset = 0) {
    const movies = await Movies.findAll({
        attributes: { exclude: ['actors']},
        where: {title},
        order: [[sortParam, order]],
        limit,
        offset,
    });
    return movies.map( x => x.dataValues);
}

async function findMovieByActor(name, sortParam = 'id', order = 'ASC', limit = 20, offset = 0) {
    let actorID;
    const actor = await Actors.findAll({
        attributes: ['id'],
        where: {name: name},
    });
    if (actor.length) actorID = actor[0].dataValues.id;
    const movies = await Movies.findAll({
        attributes: { exclude: ['actors']},
        where: {"actors": {[Op.contains]: [actorID]}},
        order: [[sortParam, order]],
        limit,
        offset,
    });
    return movies.map( x => x.dataValues);
}

module.exports = {
    genToken,
    checkEmail,
    createUser,
    verifyUser,
    addMovie,
    deleteMovie,
    selectMovie,
    updateMovie,
    findMovie,
    findMovieByTitle,
    findMovieByActor,
    getActorInfo,
}