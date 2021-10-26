const DataTypes = require('sequelize');

const Movies = {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    year: {
        type: DataTypes.NUMBER,
        allowNull: false,
    },
    format: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    actors: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
    },
};

const Actors = {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
};

const Users = {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
};

module.exports = {
    Movies,
    Actors,
    Users,
}