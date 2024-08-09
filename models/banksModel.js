module.exports = (sequelize,DataTypes)=>{
  return sequelize.define('bank',{
    bank_name:{type: DataTypes.STRING, allowNull:false},
    fullname:{type: DataTypes.STRING,allowNull:false},
    bank_address:{type: DataTypes.STRING,allowNull:false},
    account_no:{type: DataTypes.STRING,allowNull:false},
    account_type:{type: DataTypes.STRING,allowNull:false},
    route_no:{type: DataTypes.STRING,allowNull:true},
    swift:{type: DataTypes.STRING,allowNull:true},
    iban:{type: DataTypes.STRING,allowNull:true},
  })
}