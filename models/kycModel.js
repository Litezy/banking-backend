module.exports = (sequelize,DataTypes) =>{
    return sequelize.define('kyc',{
        firstname:{type: DataTypes.STRING, allowNull:false},
        lastname:{type: DataTypes.STRING, allowNull:false},
        dob:{type: DataTypes.STRING, allowNull:false},
        marital:{type: DataTypes.STRING, allowNull:false},
        id_type:{type: DataTypes.STRING, allowNull:false},
        address:{type: DataTypes.STRING, allowNull:false},
        id_number:{type: DataTypes.STRING, allowNull:false},
        zip:{type: DataTypes.STRING, allowNull:false},
        frontimg:{type: DataTypes.STRING, allowNull:false},
        backimg:{type: DataTypes.STRING, allowNull:false},
        status:{type: DataTypes.STRING, allowNull:true, defaultValue:'false'},
    })
}