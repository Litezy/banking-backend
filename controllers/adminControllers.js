const { ServerError, Excludes } = require('../utils/utils');

const User = require('../models').users;
const Deposit = require('../models').deposits
const KYC = require('../models').kycs
const Notify = require('../models').notifications
const Savings = require('../models').savings
const Transactions = require('../models').transactions
const Banks = require('../models').banks
const Cards = require('../models').cards
const otpgenerator = require('otp-generator')
const adminBank = require('../models').adminbanks
const moment = require('moment')
const Transhistory = require('../models').transactions
const Transfer = require('../models').transfers
const Verification = require('../models').verifications
const NewsLetter = require('../models').newsletters
const Contact = require('../models').contacts
const sendMail = require('../emails/mailConfig')



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

exports.FindUserEmail = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) return res.json({ status: 404, msg: "Email is required" })
        const findAdmin = await User.findOne({ where: { id: req.user } })
        if (!findAdmin) return res.json({ status: 404, msg: 'Unauthorized access' })
        const findUser = await User.findOne({ where: { email } })
        if (!findUser) return res.json({ status: 404, msg: 'Account not found' })
        return res.json({ status: 200, msg: 'Account found', data: findUser })
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

        findUser.balance = parseFloat(findUser.balance) + parseFloat(amount);
        await findPendingDeposit.save()
        await findUser.save()
        const ID = otpgenerator.generate(20, { specialChars: false, lowerCaseAlphabets: false })
        const trans = await Transhistory.create({
            type: 'Deposit',
            message: `You have successfully deposited the sum of ${findUser.currency}${amount} to your account.`,
            status: 'success',
            amount: amount,
            date: moment().format(`DD-MM-YYYY hh:mm A`),
            userid: findPendingDeposit.userid,
            transaction_id: ID
        })
        await sendMail({
            mailTo: findUser.email,
            subject: 'Withdrawal Approved',
            username: findUser.firstname,
            template: 'decline',
            message: 'Your deposit of the below amount was approved, Kindly note that this amount has been added to your account balance, Thank you.',
            amount: `${findUser.currency}${findPendingDeposit.amount}`,
            date: moment().format('DD MMMM YYYY hh:mm A')
        })
        return res.json({ status: 200, msg: 'Deposit Validated', data: trans })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}
exports.DeclineDeposits = async (req, res) => {
    try {
        const findAdmin = await User.findOne({ where: { id: req.user } });
        if (!findAdmin || findAdmin.role !== 'admin') return res.json({ status: 404, msg: 'Unauthorized access to this route' });

        const { id } = req.body;
        if (!id) return res.json({ status: 400, msg: 'Incomplete request for approval' });

        const findPendingDeposit = await Deposit.findOne({ where: { id } });
        if (!findPendingDeposit) return res.json({ status: 404, msg: 'Deposit ID not found' });

        if (findPendingDeposit.status === 'complete') return res.json({ status: 404, msg: 'Deposit already declined' });

        const findUser = await User.findOne({ where: { id: findPendingDeposit.userid } });
        if (!findUser) return res.json({ status: 404, msg: 'Unauthorized access to this route' });

        findPendingDeposit.status = 'failed';

        const ID = otpgenerator.generate(20, { specialChars: false, lowerCaseAlphabets: false });
        const trans = await Transhistory.create({
            type: 'Deposit',
            message: `Sorry, your deposit of ${findUser.currency}${findPendingDeposit.amount} failed.`,
            status: 'failed',
            amount: findPendingDeposit.amount,
            date: moment().format('DD-MM-YYYY hh:mm A'),
            userid: findPendingDeposit.userid,
            transaction_id: ID
        });

        await findPendingDeposit.save();
        await findUser.save();
        await sendMail({
            mailTo: findUser.email,
            subject: 'Withdrawal Declined',
            username: findUser.firstname,
            template: 'decline',
            message: 'Your deposit of the below amount was recently declined, Kindly try again.',
            amount: `${findUser.currency}${findPendingDeposit.amount}`,
            date: moment().format('DD MMMM YYYY hh:mm A')
        })
        return res.json({ status: 200, msg: 'Deposit declined', data: trans });
    } catch (error) {
        return res.json({ status: 500, msg: error.message });
    }
};

exports.InitiateDeposits = async (req, res) => {
    try {
        const findAdmin = await User.findOne({ where: { id: req.user } })
        if (!findAdmin || !findAdmin.role === 'admin') return res.json({ status: 404, msg: 'Unauthorized access to this route' })
        const { email, amount } = req.body
        if (!email || !amount) return res.json({ status: 404, msg: 'Incomplete request' })
        const findUser = await User.findOne({ where: { email } })
        if (!findUser) return res.json({ status: 404, msg: 'Email not found' })
        findUser.balance = parseFloat(findUser.balance) + parseFloat(amount)
        await findUser.save()
        const ID = otpgenerator.generate(20, { specialChars: false, lowerCaseAlphabets: false })
        const trans = await Transhistory.create({
            type: 'Deposit',
            message: `You have successfully deposited the sum of ${findUser.currency}${amount} to your account.`,
            status: 'success',
            amount: amount,
            date: moment().format(`DD-MM-YYYY hh:mm A`),
            userid: findUser.id,
            transaction_id: ID
        })
        return res.json({ status: 200, msg: 'Deposit success', data: trans })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}
exports.InitiateWithdraw = async (req, res) => {
    try {
        const findAdmin = await User.findOne({ where: { id: req.user } })
        if (!findAdmin || !findAdmin.role === 'admin') return res.json({ status: 404, msg: 'Unauthorized access to this route' })
        const { email, amount } = req.body
        if (!email || !amount) return res.json({ status: 404, msg: 'Incomplete request' })
        const findUser = await User.findOne({ where: { email } })
        if (!findUser) return res.json({ status: 404, msg: 'Email not found' })
        if (findUser.balance < amount) return res.json({ status: 404, msg: "Insufficient funds" })
        findUser.balance = parseFloat(findUser.balance) - parseFloat(amount)
        await findUser.save()
        const ID = otpgenerator.generate(20, { specialChars: false, lowerCaseAlphabets: false })
        const trans = await Transhistory.create({
            type: 'Withdraw',
            message: `You have successfully withdrawn the sum of ${findUser.currency}${amount} from your account.`,
            status: 'success',
            amount: amount,
            date: moment().format(`DD-MM-YYYY hh:mm A`),
            userid: findUser.id,
            transaction_id: ID
        })
        return res.json({ status: 200, msg: 'Withdrawal success', data: trans })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}


exports.getSettledDeposits = async (req, res) => {
    try {
        const trans = await Deposit.findAll({
            where: { status: ['complete', 'failed'] },
            include: [
                {
                    model: User, as: 'userdeposits',
                    attributes: { exclude: Excludes }
                },
            ],
            order: [['updatedAt', 'DESC']]
        })
        if (!trans) return res.json({ status: 404, msg: 'Deposits not found' })
        return res.json({ status: 200, msg: 'fetched successfully', data: trans })
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
        const trans = await Transactions.findAll({
            include: [{
                model: User, as: 'usertransactions',
                attributes: { exclude: Excludes }
            }],
            order: [['date', 'ASC']]
        })
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

exports.AlterTransaDate = async (req, res) => {
    try {
        const { id, date } = req.body
        if (!id || !date) return res.json({ status: 404, msg: 'Incomplete request' })
        const findAdmin = await User.findOne({ where: { id: req.user } })
        if (!findAdmin || !findAdmin.role === 'admin') return res.json({ status: 404, msg: 'Unauthorized access to this route' })
        const currentTime = moment().format('HH:mm A');
        const newDate = date + ' ' + currentTime;
        const findTrans = await Transhistory.findOne({ where: { id } })
        if (!findTrans) return req.json({ status: 404, msg: "Transaction not found" })
        findTrans.date = newDate
        await findTrans.save()
        return res.json({ status: 200, msg: 'Tranaction date updated successfully', data: findTrans })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}

exports.addAdminBank = async (req, res) => {
    try {
        const { bank_name, fullname, bank_address, account_no, route_no, swift, iban } = req.body
        if (!bank_address || !bank_name || !fullname || !account_no) return res.json({ status: 404, msg: 'Incomplete request' })
        const findAdmin = await User.findOne({ where: { id: req.user } })
        if (!findAdmin || !findAdmin.role === 'admin') return res.json({ status: 404, msg: 'Unauthorized access to this route' })
        const newBank = await adminBank.create({
            bank_name, bank_address, account_no, fullname, route_no, swift, iban
        })
        return res.json({ status: 200, msg: 'Bank added successfully', data: newBank })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}

exports.unhideBank = async (req, res) => {
    try {
        const { id } = req.body
        if (!id) return res.json({ status: 404, msg: 'Incomplete request' })
        const findAdmin = await User.findOne({ where: { id: req.user } })
        if (!findAdmin || !findAdmin.role === 'admin') return res.json({ status: 404, msg: 'Unauthorized access to this route' })
        const findBank = await adminBank.findOne({ where: { id } })
        if (!findBank) return res.json({ status: 404, msg: 'bank not found' })
        if (findBank.hidden === 'false') {
            findBank.hidden = 'true'
        } else {
            findBank.hidden = 'false'
        }
        await findBank.save()
        return res.json({ status: 200, msg: 'Bank status updated successfully', date: findBank })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}
exports.removeAdminBank = async (req, res) => {
    try {
        const { id } = req.body
        if (!id) return res.json({ status: 404, msg: 'Incomplete request' })
        const findAdmin = await User.findOne({ where: { id: req.user } })
        if (!findAdmin || !findAdmin.role === 'admin') return res.json({ status: 404, msg: 'Unauthorized access to this route' })
        const findBank = await adminBank.findOne({ where: { id } })
        if (!findBank) return res.json({ status: 404, msg: 'bank not found' })
        await findBank.destroy()
        return res.json({ status: 200, msg: 'Bank account deleted successfully' })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}

exports.getAdminBanks = async (req, res) => {
    try {
        const findAdmin = await User.findOne({ where: { id: req.user } })
        if (!findAdmin || !findAdmin.role === 'admin') return res.json({ status: 404, msg: 'Unauthorized access to this route' })
        const banks = await adminBank.findAll()
        if (!banks) return res.json({ status: 404, msg: 'Banks not found' })
        return res.json({ status: 200, msg: 'fetched successfully', data: banks })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}

exports.createVerification = async (req, res) => {
    try {
        const { id, amount, message } = req.body;
        if (!amount || !message || !id) {
            return res.json({ status: 400, msg: "Incomplete request" });
        }
        const findTransfer = await Transfer.findOne({ where: { id } });
        if (!findTransfer) {
            return res.json({ status: 404, msg: 'Transfer not found' });
        }
        const findUser = await User.findOne({ where: { id: findTransfer.userid } });
        if (!findUser) {
            return res.json({ status: 404, msg: 'User not found' });
        }

        const findVerification = await Verification.findOne({ where: { transferid: id } })
        if (findVerification) {
            if (findVerification.verified === 'false') return res.json({ status: 404, msg: 'Verification already in process' })
        }
        const createVerify = await Verification.create({
            amount,
            message,
            userid: findUser.id,
            transferid: id,
            verified: 'false'
        });
        await findTransfer.save()

        await sendMail({
            mailTo: findUser.email,
            subject: 'Action Required: Complete Your Transfer Verification',
            username: findUser.firstname,
            template: 'transverification',
            date: moment().format(`DD-MM-YYYY hh:mm A`)
        })
        return res.json({ status: 200, msg: 'Verification created successfully', data: createVerify });
    } catch (error) {
        return res.json({ status: 500, msg: error.message });
    }
}
// exports.updateVerification = async (req, res) => {
//     try {
//         const { id, amount, message } = req.body;
//         if (!amount || !message || !id) {
//             return res.json({ status: 400, msg: "Incomplete request" });
//         }

//         const user = req.user;
//         const findAdmin = await User.findOne({ where: { id: user } });
//         if (!findAdmin || findAdmin.role !== 'admin') {
//             return res.json({ status: 403, msg: 'Unauthorized access to this route' });
//         }

//         const findVerification = await Verification.findOne({ where: { id } });
//         if (!findVerification) {
//             return res.json({ status: 404, msg: 'Verification not found' });
//         }
//         if (findVerification.verified === 'false') return res.json({ status: 404, msg: "Updated verification not confirmed yet" })

//         const findTransfer = await Transfer.findOne({ where: { id: findVerification.transferid } });
//         if (!findTransfer) {
//             return res.json({ status: 404, msg: 'Transfer not found' });
//         }

//         const findUser = await User.findOne({ where: { id: findVerification.userid } });
//         if (!findUser) {
//             return res.json({ status: 404, msg: 'User not found' });
//         }

//         findTransfer.times = Number(findTransfer.times) || 0;
//         findTransfer.times += 1;
//         findVerification.amount = amount;
//         findVerification.message = message;
//         findVerification.verified = 'false'

//         await findVerification.save();
//         await findTransfer.save()
//         await sendMail({
//             mailTo: findUser.email,
//             subject: 'Action Required: Complete Your Transfer Verification',
//             username: findUser.firstname,
//             template: 'transverification',
//             date: moment().format('DD MMMM YYYY hh:mm A')
//         })
//         return res.json({ status: 200, msg: 'Verification updated successfully', data: findVerification });
//     } catch (error) {
//         return res.json({ status: 500, msg: error.message });
//     }
// };

exports.getAllTransfers = async (req, res) => {
    try {
        const transfer = await Transfer.findAll({
            include: [
                {
                    model: User, as: 'usertransfers',
                    attributes: { exclude: Excludes }
                },
                { model: Verification, as: 'verifications' },
            ]

        })
        if (!transfer) return res.json({ status: 404, msg: "Transfer not found" })
        return res.json({ status: 200, msg: 'success', data: transfer })
    } catch (error) {
        return res.json({ status: 500, msg: error.message });
    }
}

exports.getSingleTransfer = async (req, res) => {
    try {
        const { id } = req.params
        if (!id) return res.json({ status: 404, msg: 'Transfer ID is missing' })
        const findTransfer = await Transfer.findOne({
            where: { id },
            include: [
                {
                    model: User, as: 'usertransfers',
                    attributes: { exclude: Excludes }
                },
                { model: Verification, as: 'verifications' },
            ]

        })
        if (!findTransfer) return res.json({ status: 404, msg: "Transfer not found" })
        return res.json({ status: 200, msg: 'success', data: findTransfer })
    } catch (error) {
        return res.json({ status: 500, msg: error.message });
    }
}

exports.getAllVerifications = async (req, res) => {

    try {
        const verifications = await Verification.findAll()
        if (!verifications) return res.json({ status: 404, msg: "verifications not found" })
        return res.json({ status: 200, msg: 'success', data: verifications })
    } catch (error) {
        return res.json({ status: 500, msg: error.message });
    }
}

exports.confirmTransfer = async (req, res) => {
    try {
        const { id } = req.body
        if (!id) return res.json({ status: 404, msg: 'ID is required' })
        const findTransfer = await Transfer.findOne({ where: { id } })
        if (!findTransfer) return res.json({ status: 404, msg: "Transfer ID not found" })
        const findUser = await User.findOne({ where: { id: findTransfer.userid } })
        if (!findUser) return res.json({ status: 404, msg: 'User not found' })
        const findVerification = await Verification.findOne({ where: { transferid: findTransfer.id } })
        if (!findVerification) return res.json({ statu: 404, msg: "Verification not found" })
        findTransfer.status = 'complete'
        findTransfer.new = 'old'
        const ID = otpgenerator.generate(20, { specialChars: false, lowerCaseAlphabets: false });
        await Transhistory.create({
            type: 'Withdraw',
            message: `Congratulations, your transfer of ${findUser.currency}${findTransfer.amount} to ${findTransfer.acc_name} was successful.`,
            status: 'success',
            amount: findTransfer.amount,
            date: moment().format('DD-MM-YYYY hh:mm A'),
            userid: findUser.id,
            transaction_id: ID
        });
        await findTransfer.save()
        return res.json({ status: 200, msg: 'Transfer successfully completed' })
    } catch (error) {
        return res.json({ status: 500, msg: error.message });
    }
}

exports.getAllEmailSubs = async (req, res) => {
    try {
        const subs = await NewsLetter.findAll()
        if (!subs) return res.json({ status: 404, msg: 'Email subs not found' })
        return res.json({ status: 200, msg: "success", data: subs })
    } catch (error) {
        return res.json({ status: 500, msg: error.message });
    }
}
exports.getAllContacts = async (req, res) => {
    try {
        const subs = await Contact.findAll()
        if (!subs) return res.json({ status: 404, msg: 'contacts not found' })
        return res.json({ status: 200, msg: "success", data: subs })
    } catch (error) {
        return res.json({ status: 500, msg: error.message });
    }
}

exports.sendPaymentOtp = async (req, res) => {
    try {
        const { email, id } = req.body
        if (!email || !id) return res.json({ status: 404, msg: 'Either email or ID is missing' })
        const findEmail = await User.findOne({ where: { email } })
        if (!findEmail) return res.json({ status: 404, msg: 'Invalid Account' })
        const findVerify = await Verification.findOne({ where: { id } })
        if (!findVerify) return res.json({ status: 404, msg: 'Verification ID not found' })
        const otp = otpgenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false })
        findEmail.reset_code = otp
        findVerify.code = 'sent'
        findVerify.verified = 'false'
        await findEmail.save()
        await findVerify.save()
        await sendMail({
            code: otp,
            mailTo: findEmail.email,
            subject: 'Payment Verification Code',
            username: findEmail.firstname,
            message: 'Copy and paste your payment verification code below',
            template: 'verification',
            fullname: ` ${findEmail.firstname} ${findEmail.lastname}`,
            email: findEmail.email,
            date: moment().format('DD MMMM YYYY hh:mm A')
        })

        res.json({ status: 200, msg: 'OTP resent successfuly' })
    } catch (error) {
        return res.json({ status: 500, msg: error.message });
    }
}


