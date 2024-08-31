module.exports = (sequelize,DataTypes) =>{
    return sequelize.define('kyc',{
        dob:{type: DataTypes.STRING, allowNull:'false'},
        marital:{type: DataTypes.STRING, allowNull:'false'},
        id_type:{type: DataTypes.STRING, allowNull:'false'},
        first_address:{type: DataTypes.STRING, allowNull:'false'},
        second_address:{type: DataTypes.STRING, allowNull:'true'},
        id_number:{type: DataTypes.STRING, allowNull:'false'},
        zip:{type: DataTypes.STRING, allowNull:'false'},
        frontimg:{type: DataTypes.STRING, allowNull:'false'},
        backimg:{type: DataTypes.STRING, allowNull:'false'},
        status:{type: DataTypes.STRING, allowNull:'true', defaultValue:'false'},
    })
}