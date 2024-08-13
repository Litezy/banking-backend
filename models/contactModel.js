module.exports = (sequelize,DataTypes)=>{
    return sequelize.define('contact', {
        name:{type: DataTypes.STRING},
        email:{type: DataTypes.STRING},
        subject:{type: DataTypes.STRING},
        message:{type: DataTypes.STRING,allowNull:'false'}
    }) 
}