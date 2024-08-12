module.exports = (sequelize,DataTypes)=>{
    return sequelize.define('verification', {
        amount:{type: DataTypes.FLOAT,allowNull:"false"},
        message:{type:DataTypes.STRING, allowNull:"false"},
        image:{type:DataTypes.STRING},
        code:{type:DataTypes.STRING},
        userid:{type:DataTypes.INTEGER,allowNull:'false'},
        transferid:{type:DataTypes.INTEGER},
        verified:{type:DataTypes.STRING, defaultValue:"false"}
    })
}