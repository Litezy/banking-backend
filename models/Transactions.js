module.exports=(sequelize,DataTypes)=>{
    return sequelize.define('transaction',{
        amount:{type:DataTypes.STRING},
        status:{type: DataTypes.STRING, allowNull:false, defaultValue:'pending'},
        type:{type: DataTypes.STRING, allowNull:false},
        date:{type: DataTypes.STRING},
        message:{type: DataTypes.STRING, allowNull:true},
        transaction_id:{type: DataTypes.STRING, allowNull:false}
    })
}