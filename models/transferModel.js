module.exports = (sequelize,DataTypes)=>{
    return sequelize.define('transfer',{
        acc_name:{type:DataTypes.STRING, allowNull:"false"},
        acc_no:{type:DataTypes.STRING, allowNull:"false"},
        bank_name:{type:DataTypes.STRING, allowNull:"false"},
        swift:{type:DataTypes.STRING},
        memo:{type:DataTypes.STRING, allowNull:'false'},
        transid:{type:DataTypes.STRING, allowNull:'false'},
        status:{type:DataTypes.STRING, allowNull:"false", defaultValue:'pending'},
        amount:{type:DataTypes.FLOAT,allowNull:'false'},
        userid:{type:DataTypes.INTEGER}, 
    }) 
}