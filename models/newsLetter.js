module.exports = (sequelize,DataTypes)=>{
    return sequelize.define('newsletter', {
        email:{type: DataTypes.STRING,allowNull:'false'}, 
    })
}