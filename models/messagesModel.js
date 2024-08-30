module.exports=(sequelize,DataTypes) =>{
    return sequelize.define('message',{
      userid:{type: DataTypes.INTEGER},
      adminid:{type: DataTypes.INTEGER},
      ticketid:{type: DataTypes.INTEGER},
      image:{type: DataTypes.STRING},
      message:{type: DataTypes.STRING, allowNull:'false'}
    })
 }