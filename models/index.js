const { Sequelize, DataTypes } = require("sequelize");


const sequelize = new Sequelize(process.env.DB_NAME || 'banking', process.env.DB_USER || 'root', process.env.DB_PASSWORD || '', {
    host: process.env.DB_HOST || 'localhost',
    dialect: process.env.DB_DIALECT || 'mysql'
  });

  sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
  }).catch(err => {
    console.error('Unable to connect to the database:', err);
  });


  const db = {}

  db.sequelize = sequelize 
  db.Sequelize = Sequelize

  db.users = require('./userModel')(sequelize, DataTypes)
  db.notifications = require(`./notificationModel`)(sequelize,DataTypes)
  db.savings = require(`./savingsModel`)(sequelize,DataTypes)
  db.transactions = require(`./Transactions`)(sequelize,DataTypes)
  db.loans = require(`./loans`)(sequelize,DataTypes)
  db.cards = require(`./cardsModel`)(sequelize,DataTypes)
  db.banks = require(`./banksModel`)(sequelize,DataTypes)
  db.deposits = require(`./depositModel`)(sequelize,DataTypes)
  db.kycs = require(`./kycModel`)(sequelize,DataTypes)
  db.adminbanks = require(`./adminBank`)(sequelize,DataTypes)
  db.verifications = require(`./verificationsModel`)(sequelize,DataTypes)
  db.transfers = require(`./transferModel`)(sequelize,DataTypes)
  db.contacts = require(`./contactModel`)(sequelize,DataTypes)
  db.newsletters = require(`./newsLetter`)(sequelize,DataTypes)

  //One to Many relationships
  db.users.hasMany(db.notifications,{foreignKey:'user', as:'usernotify'})
  db.users.hasMany(db.savings,{foreignKey:'user', as:'usersavings'})
  db.users.hasMany(db.transactions,{foreignKey:'userid', as:'usertransactions'})
  db.users.hasMany(db.loans, {foreignKey:"userid" ,as:"userloans"})
  db.users.hasMany(db.cards, {foreignKey:"userid" ,as:"usercards"})
  db.users.hasMany(db.banks, {foreignKey:"userid" ,as:"userbanks"})
  db.users.hasMany(db.deposits, {foreignKey:"userid" ,as:"userdeposits"})
  db.users.hasOne(db.kycs, {foreignKey:"userid" ,as:"userkycs"})
  db.users.hasMany(db.verifications, {foreignKey:"userid" ,as:"userverify"})
  db.users.hasMany(db.transfers, {foreignKey:"userid" ,as:"usertransfers"})
  db.transfers.hasMany(db.verifications, {foreignKey:"transferid" ,as:"verifications"})



 //One to One relationship
  db.notifications.belongsTo(db.users,{foreignKey:'user',as:'usernotify'})
  db.savings.belongsTo(db.users, {foreignKey:'user', as:'usersavings'})
  db.transactions.belongsTo(db.users, {foreignKey:'userid', as:'usertransactions'})
  db.loans.belongsTo(db.users, {foreignKey:"userid" ,as:"userloans"})
  db.cards.belongsTo(db.users, {foreignKey:"userid" ,as:"usercards"})
  db.banks.belongsTo(db.users, {foreignKey:"userid" ,as:"userbanks"})
  db.deposits.belongsTo(db.users, {foreignKey:"userid" ,as:"userdeposits"})
  db.kycs.belongsTo(db.users, {foreignKey:"userid" ,as:"userkycs"})
  db.verifications.belongsTo(db.users, {foreignKey:"userid" ,as:"userverify"}) 
  db.verifications.belongsTo(db.transfers, {foreignKey:"transferid" ,as:"verifications"}) 
  db.transfers.belongsTo(db.users, {foreignKey:"userid" ,as:"usertransfers"}) 
  

  db.sequelize.sync({force: false})
  .then(() => console.log('Connection has been established successfully'))
  .catch(error => console.log(`${error}`))

  module.exports = db