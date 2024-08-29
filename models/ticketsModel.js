module.exports=(sequelize,DataTypes) =>{
   return sequelize.define('ticket',{
     userid:{type: DataTypes.INTEGER},
     title:{type: DataTypes.STRING, allowNull:'false'},
     image:{type: DataTypes.STRING},
     message:{type: DataTypes.STRING, allowNull:'false'}
   })
}