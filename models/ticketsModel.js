module.exports=(sequelize,DataTypes) =>{
   return sequelize.define('ticket',{
     userid:{type: DataTypes.INTEGER},
     subject:{type: DataTypes.STRING, allowNull:'false'},
     image:{type: DataTypes.STRING},
     status:{type: DataTypes.STRING, allowNull:'false', defaultValue:'pending'},
     message:{type: DataTypes.STRING, allowNull:'false'},
     joined:{type: DataTypes.STRING, defaultValue:'false'}
   })
}