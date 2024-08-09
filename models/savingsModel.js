module.exports = (sequelize,DataTypes) =>{
    return sequelize.define('saving', {
        goal:{type: DataTypes.FLOAT, allowNull:false},
        name:{type: DataTypes.STRING, allowNull:false},
        current:{type: DataTypes.FLOAT, allowNull:true},
        lastsaved:{type:DataTypes.STRING,allowNull:false},  
    })
}