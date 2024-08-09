module.exports = (sequelize, DataTypes) => {
    return sequelize.define('card', {
        name: { type: DataTypes.STRING },
        card_no:{type: DataTypes.STRING},
        cvv:{type: DataTypes.STRING},
        type:{type: DataTypes.STRING},
        exp:{type: DataTypes.STRING}

    })
}