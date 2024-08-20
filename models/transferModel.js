module.exports = (sequelize,DataTypes)=>{
    return sequelize.define('transfer',{
        acc_name:{type:DataTypes.STRING, allowNull:"false"},
        acc_no:{type:DataTypes.STRING, allowNull:"false"},
        bank_name:{type:DataTypes.STRING, allowNull:"false"},
        route:{type:DataTypes.STRING},
        status:{type:DataTypes.STRING, allowNull:"false", defaultValue:'pending'},
        new:{type:DataTypes.STRING, allowNull:"false", defaultValue:'true'},
        amount:{type:DataTypes.FLOAT,allowNull:'false'},
        times:{type:DataTypes.INTEGER, allowNull:'true', defaultValue:0}, 
        userid:{type:DataTypes.INTEGER}, 
    }) 
}