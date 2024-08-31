module.exports=(sequelize,DataTypes) =>{
   return sequelize.define('ticket',{
     userid:{type: DataTypes.INTEGER},
     adminid:{type: DataTypes.INTEGER, allowNull:'true'},
     subject:{type: DataTypes.STRING, allowNull:'false'},
     image:{type: DataTypes.STRING},
     status:{type: DataTypes.STRING, allowNull:'false', defaultValue:'active'},
     message:{type: DataTypes.STRING, allowNull:'false'},
     joined:{type: DataTypes.STRING, defaultValue:'false'}
   })
}