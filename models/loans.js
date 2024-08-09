const { duration } = require("moment")

module.exports = (sequelize,DataTypes)=>{
    return sequelize.define('loan',{
        amount:{type: DataTypes.STRING},
        duration:{type:DataTypes.STRING},
        fullname: {type: DataTypes.STRING},
    })
}