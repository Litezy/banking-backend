const { ServerError } = require('../utils/utils');

const User = require('../models').users;
const Deposit = require('../models').deposits
const KYC = require('../models').kycs
const Notify = require('../models').notifications
const Savings = require('../models').savings
const Transactions = require('../models').transactions
const Banks = require('../models').banks
const Cards = require('../models').cards
const otpgenerator = require('otp-generator')
const moment = require('moment')



exports.getAllUsers = async (req, res) => {
    try {
        const findAdmin = await User.findOne({ where: { id: req.user } })
        if (!findAdmin) return res.json({ status: 404, msg: 'Unauthorized access' })
        const users = await User.findAll()
        return res.json({ status: 200, msg: 'fetched successfully', data: users })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}

exports.getAllDeposits = async (req, res) => {
    try {
        const findAdmin = await User.findOne({ where: { id: req.user } })
        if (!findAdmin) return res.json({ status: 404, msg: 'Unauthorized access' })
        const alldepo = await User.sum('balance')
        return res.json({ status: 200, msg: 'fetched successfully', data: alldepo })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}

exports.getKYCUsers = async (req, res) => {
    try {
        const findAdmin = await User.findOne({ where: { id: req.user } })
        if (!findAdmin) return res.json({ status: 404, msg: 'Unauthorized access' })
        const users = await KYC.findAll()
        return res.json({ status: 200, msg: 'fetched successfully', data: users })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}
exports.getPaymentProof = async (req, res) => {
    try {
        const findAdmin = await User.findOne({ where: { id: req.user } })
        if (!findAdmin) return res.json({ status: 404, msg: 'Unauthorized access' })
        const plans = await Deposit.findAll({
            where: { status: 'pending' },
            include: [{
                model: User, as: 'userdeposits'
            }]
        })
        return res.json({ status: 200, msg: 'fetched successfully', data: plans })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}




exports.ValidateDeposits = async (req, res) => {
    try {
        const findAdmin = await User.findOne({ where: { id: req.user } })
        if (!findAdmin || !findAdmin.role === 'admin') return res.json({ status: 404, msg: 'Unauthorized access to this route' })
        const { id, amount } = req.body
        if (!id || !amount) return res.json({ status: 400, msg: 'Incomplete request for approval' })
        const findPendingDeposit = await Deposit.findOne({ where: { id } })
        if (!findPendingDeposit) return res.json({ status: 200, msg: 'deposit id not found' })
        if (findPendingDeposit.status === 'complete') return res.json({ status: 404, msg: 'deposit already validated' })
        const findUser = await User.findOne({ where: { id: findPendingDeposit.userid } })
        if (!findUser) return res.json({ status: 404, msg: 'Unauthorized access to this route' })
        findPendingDeposit.status = 'complete'
        findUser.balance = findUser.balance += amount
        await findPendingDeposit.save()
        await findUser.save()
        await Notify.create({
            type: 'deposit successful',
            message: `You have successfully deposited the sum of ${amount} to your account.`,
            status: 'unread',
            user: findPendingDeposit.userid
        })
        return res.json({ status: 200, msg: 'Deposit Validated' })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}


exports.DeclineDeposits = async (req, res) => {
    try {
        const { id } = req.body
        if (!id) return res.json({ status: 404, msg: 'Deposit id required' })
        const findDeposit = await Deposit.findOne({ where: { id } })
        if (!findDeposit) return res.json({ status: 404, msg: 'Deposit not found' })
        const findUser = await User.findOne({ where: { id: findDeposit.user } })
        if (!findUser) return res.json({ status: 404, msg: 'Unauthorized access' })
        let totalDeposits = await Deposit.sum('amount', { where: { user: findDeposit.user } });
        let newCurrentBalance = totalDeposits;
        newCurrentBalance -= parseFloat(findDeposit.amount);
        findDeposit.status = 'declined'
        findDeposit.message = `You deposit of ${formatter.format(findDeposit.amount)} to your account via the company's ${findDeposit.wallet} wallet with the transaction ID ${findDeposit.trnxid} was declined.`
        findDeposit.cur_bal = newCurrentBalance
        findDeposit.save()
        const notification = await Notify.create({
            type: 'deposit Declined',
            message: `Your deposit of ${formatter.format(findDeposit.amount)} to your account was declined.`,
            status: 'unread',
            notify: findDeposit.user
        })
        return res.json({ status: 200, msg: 'Deposit successfully declined' })

    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}

exports.getAdminProfile = async (req, res) => {
    try {
        const Admin = await User.findAll({ where: { role: 'admin' } })
        return res.json({ status: 200, msg: 'fetched successfully', data: Admin })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}


exports.getAllPlans = async (req, res) => {
    try {
        const findAdmin = await User.findOne({ where: { id: req.user } })
        if (!findAdmin || !findAdmin.role === 'admin') return res.json({ status: 404, msg: 'Unauthorized access to this route' })
        const plans = await Savings.findAll()
        if (!plans) return res.json({ status: 404, msg: 'Plans not found' })
        return res.json({ status: 200, msg: 'fetched successfully', data: plans })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}
exports.getAllTrans = async (req, res) => {
    try {
        const findAdmin = await User.findOne({ where: { id: req.user } })
        if (!findAdmin || !findAdmin.role === 'admin') return res.json({ status: 404, msg: 'Unauthorized access to this route' })
        const trans = await Transactions.findAll()
        if (!trans) return res.json({ status: 404, msg: 'transactions not found' })
        return res.json({ status: 200, msg: 'fetched successfully', data: trans })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}
exports.getUserBanks = async (req, res) => {
    try {
        const findAdmin = await User.findOne({ where: { id: req.user } })
        if (!findAdmin || !findAdmin.role === 'admin') return res.json({ status: 404, msg: 'Unauthorized access to this route' })
        const banks = await Banks.findAll({
            include: [{
                model: User, as: 'userbanks'
            }]
        })
        if (!banks) return res.json({ status: 404, msg: 'transactions not found' })
        return res.json({ status: 200, msg: 'fetched successfully', data: banks })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}
exports.getUserCards = async (req, res) => {
    try {
        const findAdmin = await User.findOne({ where: { id: req.user } })
        if (!findAdmin || !findAdmin.role === 'admin') return res.json({ status: 404, msg: 'Unauthorized access to this route' })
        const cards = await Cards.findAll({
            include: [{
                model: User, as: 'usercards'
            }]
        })
        if (!cards) return res.json({ status: 404, msg: 'transactions not found' })
        return res.json({ status: 200, msg: 'fetched successfully', data: cards })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}

exports.CreateUser = async (req, res) => {
    try {
        const { firstname, lastname, email, phone, dialcode, country, state, password, confirm_password, gender } = req.body
        const findAdmin = await User.findOne({ where: { id: req.user } })
        if (!findAdmin || !findAdmin.role === 'admin') return res.json({ status: 404, msg: 'Unauthorized access to this route' })
        if (!firstname) return res.json({ status: 404, msg: `First name field is required` })
        if (!lastname) return res.json({ status: 404, msg: `Last name field is required` })
        if (!email) return res.json({ status: 404, msg: `Email address field is required` })
        if (!phone) return res.json({ status: 404, msg: `Phone number field is required` })
        if (!dialcode) return res.json({ status: 404, msg: `Country's dial code field is required` })
        if (!country) return res.json({ status: 404, msg: `Your country of origin is required` })
        if (!gender) return res.json({ status: 404, msg: `Gender field can't be empty ` })
        if (!state) return res.json({ status: 404, msg: `Your state of origin is required` })
        if (!password) return res.json({ status: 404, msg: `Password field is required` })
        if (confirm_password !== password) return res.json({ status: 404, msg: `password(s) mismatched` })
        const checkEmail = await User.findOne({ where: { email } })
        if (checkEmail) return res.json({ status: 400, msg: "Email already exists with us" })
        const checkPhone = await User.findOne({ where: { phone } })
        if (checkPhone) return res.json({ status: 400, msg: "Phone number already exists with us" })
        const Otp = otpgenerator.generate(10, { specialChars: false, lowerCaseAlphabets: false, upperCaseAlphabets: false })
        User.create({
            firstname,
            lastname,
            email,
            password,
            dialcode,
            phone,
            country,
            gender,
            state,
            refid: phone,
            account_number: Otp,
            status: 'online',
            lastlogin: moment().format('DD-MM-YYYY hh:mmA')
        })
        return res.json({ status: 200, msg: ' Acount created successfully' })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}









