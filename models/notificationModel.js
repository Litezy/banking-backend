module.exports = (sequelize, DataTypes) => {
    return sequelize.define('notification', {
        type:{type: DataTypes.STRING, allowNull:false},
        message:{type: DataTypes.STRING, allowNull:false},
        status:{type: DataTypes.STRING, allowNull:false, defaultValue:'unread'}
    })
}