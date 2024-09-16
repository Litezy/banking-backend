module.exports =(sequelize,DataTypes) =>{
    return sequelize.define(`card_requests`, {
        card_type:{type:DataTypes.STRING, allowNull:'false'},
        visa_type:{type:DataTypes.STRING},
        created:{type:DataTypes.STRING, defaultValue:'false'},
        userid:{type:DataTypes.INTEGER, allowNull:'false'},
    })
}