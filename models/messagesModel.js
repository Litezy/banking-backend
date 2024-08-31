module.exports=(sequelize,DataTypes) =>{
    return sequelize.define('message',{
      sender:{type: DataTypes.INTEGER,allowNull:'false'},
      ticketid:{type: DataTypes.INTEGER},
      image:{type: DataTypes.STRING},
      message:{type: DataTypes.STRING, allowNull:'false'}
    })
 }