module.exports = (sequelize,DataTypes)=>{
    return sequelize.define('transfer',{
        acc_name:{type:DataTypes.STRING, allowNull:"false"},
        acc_no:{type:DataTypes.STRING, allowNull:"false"},
        bank_name:{type:DataTypes.STRING, allowNull:"false"},
        route:{type:DataTypes.STRING},
        status:{type:DataTypes.STRING, allowNull:"false", defaultValue:'pending'},
        amount:{type:DataTypes.FLOAT,allowNull:'false'},
        userid:{type:DataTypes.INTEGER}, 
    }) 
}