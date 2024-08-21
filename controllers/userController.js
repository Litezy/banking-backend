const { ServerError, Excludes, ExcludeNames } = require("../utils/utils")
const otpgenerator = require('otp-generator')
const User = require('../models').users
const jwt = require('jsonwebtoken')
const moment = require('moment')
const Savings = require('../models').savings
const path = require('path')
const Banks = require('../models').banks
const Loan = require('../models').loans
const TransHistory = require('../models').transactions
const Notify = require('../models').notifications
const Card = require('../models').cards
const fs = require('fs')
const slug = require('slug')
const axios = require('axios')
const Deposit = require('../models').deposits
const KYC = require('../models')
const Transfer = require('../models').transfers
const Verification = require('../models').verifications
const adminBank = require('../models').adminbanks
const Contact = require('../models').contacts
const sendMail = require('../emails/mailConfig')
const NewsLetter = require('../models').newsletters



exports.SignupUserAccount = async (req, res) => {
  try {
    const { firstname, lastname, email, phone, dialcode, country, state, password, confirm_password, gender } = req.body
    if (!firstname) return res.json({ status: 404, msg: `First name field is required` })
    if (!lastname) return res.json({ status: 404, msg: `Last name field is required` })
    if (!email) return res.json({ status: 404, msg: `Email address field is required` })
    if (!phone) return res.json({ status: 404, msg: `Phone number field is required` })
    if (!dialcode) return res.json({ status: 404, msg: `Country's dial code field is required` })
    if (!country) return res.json({ status: 404, msg: `Your country of origin is required` })
    if (!gender) return res.json({ status: 404, msg: `Gender field can't be empty ` })
    if (!state) return res.json({ status: 404, msg: `Your state of origin is required` })
    if (!password) return res.json({ status: 404, msg: `Password field is required` })
    if (!confirm_password) return res.json({ status: 404, msg: `Confirm password field is required` })
    const checkEmail = await User.findOne({ where: { email } })
    if (checkEmail) return res.json({ status: 400, msg: "Email already exists with us" })
    const checkPhone = await User.findOne({ where: { phone } })
    if (checkPhone) return res.json({ status: 400, msg: "Phone number already exists with us" })
    if (password !== confirm_password) return res.json({ status: 404, msg: 'Password(s) mismatch' })
    let Currency;
    try {
      const response = await axios.get(`https://restcountries.com/v3.1/name/${country}`);
      if (response.data && response.data.length > 0) {
        const countryData = response.data[0];
        const currencySymbol = Object.values(countryData.currencies)[0].symbol;
        Currency = currencySymbol;
      } else {
        console.error('Unexpected response format:', response);
      }
    } catch (apiError) {
      console.error('Error fetching currency:', apiError);
      return res.status(500).json({ status: 500, msg: 'Failed to fetch currency information' });
    }
    const Otp = otpgenerator.generate(10, { specialChars: false, lowerCaseAlphabets: false, upperCaseAlphabets: false })
    const code = otpgenerator.generate(4, { specialChars: false, lowerCaseAlphabets: false, upperCaseAlphabets: false })
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
      currency: Currency,
      reset_code: code,
      lastlogin: moment().format('DD-MM-YYYY hh:mmA')
    })

    await sendMail({ code: code, mailTo: email, subject: 'Account Verification Code', username: firstname, message: 'Copy and paste your account verification code below', template: 'verification', fullname: ` ${firstname} ${lastname}`, email: email, date: moment().format('DD MMMM YYYY hh:mm A') })
    return res.json({ status: 200, msg: ' Acount created successfully' })
  } catch (error) {
    ServerError(res, error)
  }
}

exports.LoginAcc = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.json({ status: 404, msg: "Incomplete request" })
    const user = await User.findOne({ where: { email } })
    if (!user) return res.json({ status: 400, msg: 'Account not found' })
    if (user.password !== password) return res.json({ status: 404, msg: 'Invalid password' })
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '9h' })
    user.status = 'online'
    return res.json({ status: 200, msg: 'Login successful', token })
  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }
}

exports.GetUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.user },
      attributes: {
        exclude: ExcludeNames
      }

    })
    if (!user) return res.json({ status: 400, msg: 'Incomplete request' })
    return res.json({ status: 200, msg: 'Profile fetched successfully', data: user })
  } catch (error) {
    return res.json({ status: 500, msg: error.message })

  }
}

exports.logOutUser = async (req, res) => {
  try {
    if (!req.user) return res.json({ status: 400, msg: 'User not authenticated' })
    const user = await User.findOne({ where: { id: req.user } })
    if (!user) return res.json({
      status: 404,
      msg: `Account not found`,
    })
    user.status = 'offline'
    await user.save()
    return res.json({ status: 200, msg: `Logged out successfully ` })

  } catch (error) {
    return res.json({ status: 404, msg: error })
  }
}



exports.ChangeProfileImage = async (req, res) => {
  try {
    const { firstname, email } = req.body
    if (!firstname || !email) return res.json({ status: 404, msg: 'Incomplete request' })
    if (!req.files) return res.json({ status: 404, msg: 'profile image is required' })
    const findProfile = await User.findOne({ where: { email } })
    const image = req?.files?.image  // null or undefined
    let imageName;
    const filePath = './public/profiles'
    const currentImagePath = `${filePath}/${findProfile.image}`
    if (image) {
      // Check image size and format
      if (image.size >= 1000000) return res.json({ status: 400, msg: `Cannot upload up to 1MB` })
      if (!image.mimetype.startsWith('image/')) return res.json({ status: 400, msg: `Invalid image format (jpg, jpeg, png, svg, gif, webp)` })

      // Check for the existence of the current image path and delete it
      if (fs.existsSync(currentImagePath)) {
        fs.unlinkSync(currentImagePath)
      }

      // Check for the existence of the image path
      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath)
      }
      imageName = `${slug(firstname, '-')}.png`
      findProfile.image = imageName
      await image.mv(`${filePath}/${imageName}`)
    }
    await findProfile.save()
    return res.json({ status: 200, msg: 'profile image uploaded successfully', data: findProfile })
  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }
}


exports.VerifyEmail = async (req, res) => {

  try {
    const { reset_code, email } = req.body
    if (!reset_code || !email) return res.json({ status: 404, msg: 'Incomplete Request' })
    const FindEmail = await User.findOne({ where: { email } })
    if (!FindEmail) return res.json({ status: 404, msg: 'Account not found' })
    if (reset_code !== FindEmail.reset_code) return res.json({ status: 404, msg: 'Invalid code' })
    FindEmail.reset_code = null
    FindEmail.verified = 'true'
    await FindEmail.save()
    await sendMail({
      mailTo: email,
      fullname: `${FindEmail.firstname} ${FindEmail.lastname}`,
      subject: 'Successful SignUp',
      username: FindEmail.firstname,
      date: moment().format('DD MMMM YYYY hh:mm A'),
      accountNo: FindEmail.account_number,
      template: 'welcome'
    })
    return res.json({ status: 200, msg: 'Code verified successfully' })

  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }
}
exports.VerifyPasswordChange = async (req, res) => {

  try {
    const { reset_code, email } = req.body
    if (!reset_code || !email) return res.json({ status: 404, msg: 'Incomplete Request' })
    const FindEmail = await User.findOne({ where: { email } })
    if (!FindEmail) return res.json({ status: 404, msg: 'Account not found' })
    if (reset_code !== FindEmail.reset_code) return res.json({ status: 404, msg: 'Invalid code' })
    FindEmail.reset_code = null
    FindEmail.verified = 'true'
    await FindEmail.save()
    return res.json({ status: 200, msg: 'Code verified successfully' })

  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }
}
exports.verifyOtp = async (req, res) => {
  try {
    const { reset_code, email, id } = req.body
    if (!reset_code || !email || !id) return res.json({ status: 404, msg: 'Incomplete Request' })
    const FindEmail = await User.findOne({ where: { email } })
    if (!FindEmail) return res.json({ status: 404, msg: 'Account not found' })
    const findVerification = await Verification.findOne({ where: { id } })
    if (!findVerification) return res.json({ status: 404, msg: 'Verification not found, contact support' })
    if (reset_code !== FindEmail.reset_code) return res.json({ status: 404, msg: 'Invalid code' })
    FindEmail.reset_code = null
    findVerification.verified = 'true'
    await findVerification.save()
    await FindEmail.save()
    return res.json({ status: 200, msg: 'payment verified successfully' })

  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }
}

exports.findUserAccount = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.json({ status: 404, msg: 'Email is required' })
    const findEmail = await User.findOne({ where: { email } })
    if (!findEmail) return res.json({ status: 404, msg: 'Account not found' })
    const otp = otpgenerator.generate(4, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false })
    findEmail.reset_code = otp
    await findEmail.save()
    await sendMail({ code: otp, mailTo: findEmail.email, subject: 'Email Verification Code', username: findEmail.firstname, message: 'Copy and paste your email verification code below', template: 'verification', fullname: ` ${findEmail.firstname} ${findEmail.lastname}`, email: findEmail.email, date: moment().format('DD MMMM YYYY hh:mm A') })
    res.json({ status: 200, msg: 'OTP resent successfuly' })
  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }
}

exports.RequestEmailOtp = async (req, res) => {
  try {
    const { email, new_email } = req.body
    if (!email || !new_email) return res.json({ status: 404, msg: 'Incomplete request' })
    const findAcc = await User.findOne({ where: { id: req.user, email } })
    if (!findAcc) return res.json({ status: 404, msg: 'Account not found' })
    const otp = otpgenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false })
    findAcc.reset_code = otp
    await sendMail({ code: otp, mailTo: findAcc.email, subject: 'Email Verification Code', username: findAcc.firstname, message: 'Copy and paste your email verification code below', template: 'verification', fullname: ` ${findAcc.firstname} ${findAcc.lastname}`, email: findAcc.email, date: moment().format('DD MMMM YYYY hh:mm A') })
    await findAcc.save()
    return res.json({ status: 200, msg: 'Otp sent successfully.' })
  } catch (error) {

  }
}

exports.ChangeUserPassword = async (req, res) => {
  try {
    const { email, new_password, confirm_password } = req.body
    if (!email || !new_password || !confirm_password) return res.json({ status: 404, msg: 'Incomplete rquest to change password' })
    const finduser = await User.findOne({ where: { email } })
    if (!finduser) return res.json({ status: 400, msg: 'Account not found ' })
    if (new_password !== confirm_password) return res.json({ status: 404, msg: 'Password(s) mismatched' })
    finduser.password = new_password
    await finduser.save()
    await Notify.create({
      type: 'Account Password Change',
      message: `Your request to change your account password was successful.`,
      status: 'unread',
      user: finduser.id
    })
    await sendMail({ mailTo: finduser.email, subject: 'Password Verification Successfull', username: finduser.firstname, message: 'Your request to change your account password was successful, login to your account with the new password', template: 'emailpass', date: moment().format('DD MMMM YYYY hh:mm A') })
    return res.json({ status: 200, msg: "Password changed succesfully, login account" })
  } catch (error) {
    return res.json({ status: 404, msg: error })
  }
}
exports.ChangeAccountEmail = async (req, res) => {
  try {
    const { old_email, reset_code, new_email } = req.body
    if (!old_email || !new_email || !reset_code) return res.json({ status: 404, msg: 'Incomplete request to change email' })
    const finduser = await User.findOne({ where: { id: req.user, email: old_email } })
    if (!finduser) return res.json({ status: 400, msg: 'Old email does not match ' })
    if (finduser.reset_code !== reset_code) return res.json({ status: 400, msg: 'Invalid code' })
    const checkNewEmail = await User.findOne({ where: { email: new_email } })
    if (checkNewEmail) return res.json({ status: 404, msg: "New email already exists" })
    finduser.email = new_email
    await finduser.save()
    await Notify.create({
      type: 'Account Email Change',
      message: `Your request to change your account email was successful.`,
      status: 'unread',
      user: req.user
    })
    await sendMail({ mailTo: finduser.email, subject: 'Email Verification Successfull', username: finduser.firstname, message: 'Your request to change your account email was successful, login to your account with the new email', template: 'emailpass', date: moment().format('DD MMMM YYYY hh:mm A') })
    return res.json({ status: 200, msg: "Email changed succesfully, login account" })
  } catch (error) {
    return res.json({ status: 404, msg: error })
  }
}


exports.ResendOtp = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.json({ status: 404, msg: 'Email is required' })
    const findEmail = await User.findOne({ where: { email } })
    if (!findEmail) return res.json({ status: 404, msg: 'Invalid Account' })
    const otp = otpgenerator.generate(4, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false })
    findEmail.reset_code = otp
    await findEmail.save()
    await sendMail({ code: otp, mailTo: findEmail.email, subject: 'Account Verification Code', username: findEmail.firstname, message: 'Copy and paste your account verification code below', template: 'verification', fullname: ` ${findEmail.firstname} ${findEmail.lastname}`, email: findEmail.email, date: moment().format('DD MMMM YYYY hh:mm A') })
    res.json({ status: 200, msg: 'OTP resent successfuly' })
  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }
}


exports.EditProfile = async (req, res) => {
  try {
    const { firstname, lastname, email } = req.body;
    if (!email) return res.json({ status: 404, msg: 'Email is required' });
    const findAccount = await User.findOne({ where: { email } });
    if (!findAccount) return res.json({ status: 404, msg: 'Account not found' });
    if (firstname || country || phone || state || lastname) {
      if (firstname) {
        findAccount.firstname = firstname
      }
      if (lastname) {
        findAccount.lastname = lastname
      }
    }

    await findAccount.save()
    return res.json({ status: 200, msg: 'Profile edit success', data: findAccount });
  } catch (error) {
    console.error('Error editing profile:', error);
    return res.json({ status: 500, msg: error.message });
  }
};


//Savings Controllers
exports.GetAllSavings = async (req, res) => {
  try {
    const findUser = await User.findOne({ where: { id: req.user } })
    if (!findUser) return res.json({ status: 404, msg: 'Unauthorized account' })
    const findUserSavings = await Savings.findAll({
      where: { user: findUser.id, status: 'inprogress' },
      order: [['createdAt', 'DESC']]
    })
    if (!findUserSavings || findUserSavings.length === 0) return res.json({ status: 404, msg: 'No savings found' });

    // Calculate percentage for each savings entry
    const savingsWithPercent = findUserSavings.map(saving => {
      let percent = saving.goal ? (saving.current / saving.goal) * 100 : 0;
      percent = parseFloat(percent.toFixed(2));
      return {
        ...saving.dataValues,
        percent
      };
    });
    return res.json({ status: 200, msg: 'fetched successfully', data: savingsWithPercent })
  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }

}

//deposit
exports.Deposit = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!firstname || !amount) return res.json({ status: 404, msg: 'Incomplete request' });
    if (!req.files) return res.json({ status: 404, msg: 'Proof of payment is required' });

    const findAcc = await User.findOne({ where: { id: req.user } });
    if (!findAcc) return res.json({ status: 404, msg: "Account not found" });

    const image = req.files.image;
    let imageName;

    if (image) {
      if (image.size >= 1000000) return res.json({ status: 404, msg: `Cannot upload up to 1MB` });
      if (!image.mimetype.startsWith('image/')) return res.json({ status: 400, msg: `Invalid image format (jpg, jpeg, png, svg, gif, webp)` });
    }

    const filepath = `./public/deposits/`;
    if (!fs.existsSync(filepath)) {
      fs.mkdirSync(filepath, { recursive: true });
    }
    const files = fs.readdirSync(filepath);
    const nextFileNumber = files.length + 1;
    imageName = `${slug(findAcc.firstname)}-deposit-${nextFileNumber}.jpg`;

    const idRef = otpgenerator.generate(20, { specialChars: false, lowerCaseAlphabets: false })
    await Deposit.create({
      image: imageName,
      amount: amount,
      userid: findAcc.id // Ensure you are storing the user ID correctly
    });

    await image.mv(path.join(filepath, imageName));
    await TransHistory.create({
      type: 'Deposit',
      amount: amount,
      status: 'pending',
      date: moment().format('DD-MM-YYYY hh:mmA'),
      message: `You have initiated a deposit sum of ${findAcc.currency}${amount}, kindly wait for completion.  `,
      transaction_id: idRef,
      userid: findAcc.id
    })
    await Notify.create({
      type: 'Transfer',
      message: `You have successfully initiated a deposit of ${findAcc.currency}${amount}. pending approval.`,
      user: findAcc.id
    })

    await sendMail({
      mailTo: findAcc.email,
      username: findAcc.firstname,
      subject: 'Proof of Transfer',
      date: moment().format('DD-MM-YYYY hh:mmA'),
      template: 'deposit',
      amount: `${findAcc.currency}${amount}`
    })
    return res.json({ status: 200, msg: 'Proof of payment upload success' });
  } catch (error) {
    return res.json({ status: 500, msg: error.message });
  }
};

exports.CreateSavings = async (req, res) => {
  try {
    const { goal, name, current } = req.body;
    if (!goal || !name) return res.json({ status: 404, msg: 'Incomplete savings request' });

    const findAcc = await User.findOne({
      where: { id: req.user },
      attributes: {
        exclude: ExcludeNames
      }
    });
    if (!findAcc) return res.json({ status: 404, msg: 'Account not found' });

    if (current) {
      if (current > findAcc.balance) return res.json({ status: 404, msg: 'Insufficient balance' });
      findAcc.balance = parseFloat(findAcc.balance) - parseFloat(current);
    }


    const save = await Savings.create({
      goal: goal.toLocaleString(),
      name,
      current: current.toLocaleString(),
      lastsaved: moment().format('DD-MM-YYYY hh:mmA'),
      user: findAcc.id,
    });

    await findAcc.save();

    const idRef = otpgenerator.generate(20, { specialChars: false, lowerCaseAlphabets: false });
    let history;
    if (current) {
      history = await TransHistory.create({
        type: 'Goal Savings',
        amount: current,
        status: 'success',
        date: moment().format('DD-MM-YYYY hh:mmA'),
        message: `You have successfully created a savings goal with a target of ${findAcc.currency}${goal}. ${current ? `With an initial saving of ${findAcc.currency}${current}.` : ''}. Stay committed and watch your savings grow! Congratulations.`,
        transaction_id: idRef,
        userid: findAcc.id,
      });
    }

    await Notify.create({
      type: 'Goal Savings',
      message: 'You have successfully created a savings goal, kindly check your savings account for more details.',
      user: findAcc.id,
    });

    await sendMail({
      mailTo: findAcc.email,
      username: findAcc.firstname,
      goalname: name,
      subject: 'Goal Savings',
      date: moment().format('DD-MM-YYYY hh:mmA'),
      template: 'goals',
      goaltarget: `${findAcc.currency}${goal}`,
      goalcurrent: `${findAcc.currency}${current}`
    })
    return res.json({ status: 200, msg: 'Savings created successfully', user: findAcc });
  } catch (error) {
    return res.json({ status: 500, msg: error.message });
  }
};


exports.getAllCurrentSavings = async (req, res) => {
  try {
    const findAcc = await User.findOne({ where: { id: req.user } })
    if (!findAcc) return res.json({ status: 404, msg: 'Account not found' })
    const calculateAll = await Savings.sum('current', { where: { user: findAcc.id } });
    return res.json({ status: 200, msg: 'savings fetched successfully', calculateAll })
  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }
}

exports.TopUp = async (req, res) => {
  try {
    const { id, amount } = req.body
    if (!amount || !id) return res.json({ status: 404, msg: 'Incomplete topup request' })
    const findAcc = await User.findOne({
      where: { id: req.user },
      attributes: {
        exclude: ExcludeNames
      }
    })
    if (!findAcc) return res.json({ status: 404, msg: "Account not found" })
    const findSaving = await Savings.findOne({ where: { user: findAcc.id, id } })
    if (!findSaving) return res.json({ status: 404, msg: "Savings not found" })

    let currentBalance = parseFloat(findAcc.balance);
    let topUpAmount = parseFloat(amount);
    if (topUpAmount < 0) {
      return res.json({ status: 404, msg: 'Amount cannot be negative' });
    }
    if (isNaN(currentBalance) || isNaN(topUpAmount)) {
      return res.json({ status: 404, msg: 'Invalid balance or amount' });
    }
    if (topUpAmount > currentBalance) return res.json({ status: 404, msg: 'Insufficient balance' })
    findAcc.balance = currentBalance - topUpAmount;
    findSaving.current = parseFloat(findSaving.current) + parseFloat(topUpAmount);
    findSaving.lastsaved = moment().format('DD-MM-YYYY hh:mmA')
    await findAcc.save()
    await findSaving.save()

    const idRef = otpgenerator.generate(20, { specialChars: false, lowerCaseAlphabets: false })
    await TransHistory.create({
      type: 'Top Up',
      amount: amount,
      status: 'success',
      date: moment().format('DD-MM-YYYY hh:mmA'),
      message: `You have successfully topped up  your ${findSaving.name} savings goal. We're with you to help achieve your financial dreams, Stay committed and watch your savings soar!
    `,
      transaction_id: idRef,
      userid: findAcc.id
    })

    await Notify.create({
      type: 'Top Up',
      message: `You have successfully topped up your ${findSaving.name} savings goal, congratulations.`,
      user: findAcc.id
    })
    await sendMail({
      mailTo: findAcc.email,
      username: findAcc.firstname,
      goalname: findSaving.name,
      subject: 'Goal Savings TopUp',
      date: moment().format('DD-MM-YYYY hh:mm A'),
      template: 'topup',
      goaltarget: `${findAcc.currency}${findSaving.goal}`,
      goalcurrent: `${findAcc.currency}${amount}`
    })

    return res.json({ status: 200, msg: 'Top up success', user: findAcc })
  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }
}

exports.DeleteGoal = async (req, res) => {
  try {
    const { id } = req.body
    if (!id) return res.json({ status: 404, msg: 'Savings ID required' })
    const findAcc = await User.findOne({
      where: { id: req.user },
      attributes: {
        exclude: ExcludeNames
      }

    })
    if (!findAcc) return res.json({ status: 404, msg: 'Account not found' })
    const findSaving = await Savings.findOne({ where: { user: findAcc.id, id } })
    if (!findSaving) return res.json({ status: 404, msg: 'Savings not found' })
    const idRef = otpgenerator.generate(20, { specialChars: false, lowerCaseAlphabets: false })
    findAcc.balance = parseFloat(findAcc.balance) + parseFloat(findSaving.current)

    await findAcc.save()
    findSaving.status = 'terminated'

    await findSaving.save()
    await Notify.create({
      type: 'Savings deletion',
      message: `You have successfully terminated your ${findSaving.name} savings goal, and your currents savings sum has been added back to your account balance.`,
      user: findAcc.id
    })

    await TransHistory.create({
      type: 'Goal Savings Terminated',
      amount: findSaving.current,
      status: 'success',
      date: moment().format('DD-MM-YYYY hh:mmA'),
      message: `You have successfully terminated your ${findSaving.name} savings goal, and your currents savings sum has been added back to your account balance.`,
      transaction_id: idRef,
      userid: findAcc.id,
    });
    await sendMail({
      mailTo: findAcc.email,
      username: findAcc.firstname,
      goalname: findSaving.name,
      subject: 'Goal Savings Terminated',
      date: moment().format('DD-MM-YYYY hh:mmA'),
      template: 'goalcancel',
      goaltarget: `${findAcc.currency}${findSaving.goal}`,
      goalcurrent: `${findAcc.currency}${findSaving.current}`
    })
    return res.json({ status: 200, msg: 'Savings successfully deleted', user: findAcc })
  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }
}
exports.WithdrawGoal = async (req, res) => {
  try {
    const { id } = req.body
    if (!id) return res.json({ status: 404, msg: 'Savings ID required' })
    const findAcc = await User.findOne({
      where: { id: req.user },
      attributes: {
        exclude: ExcludeNames
      }

    })
    const findSaving = await Savings.findOne({ where: { user: findAcc.id, id } })
    if (!findSaving) return res.json({ status: 404, msg: 'Savings not found' })
    findAcc.balance = parseFloat(findAcc.balance) + parseFloat(findSaving.current)
    await findAcc.save()
    findSaving.status = 'complete'
    await findSaving.save()
    await Notify.create({
      type: 'Savings withdrawal',
      message: `You have successfully withdrawn your ${findSaving.name} savings goal, and your currents savings sum has been added  to your account balance, Congratulations.`,
      user: findAcc.id
    })
    const idRef = otpgenerator.generate(20, { specialChars: false, lowerCaseAlphabets: false });
    await TransHistory.create({
      type: 'Goal Savings Reached',
      amount: findSaving.current,
      status: 'success',
      date: moment().format('DD-MM-YYYY hh:mmA'),
      message: `You have successfully withdrawn your ${findSaving.name} goal target, this amount will be added to your balance. Congratulations!`,
      transaction_id: idRef,
      userid: findAcc.id,
    });

    await sendMail({
      mailTo: findAcc.email,
      username: findAcc.firstname,
      goalname: findSaving.name,
      subject: 'Goal Savings Reached',
      date: moment().format('DD-MM-YYYY hh:mmA'),
      template: 'goalreached',
      goaltarget: `${findAcc.currency}${findSaving.goal}`,
      goalcurrent: `${findAcc.currency}${findSaving.current}`
    })
    return res.json({ status: 200, msg: 'Savings successfully withdrawn', user: findAcc })
  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }
}


exports.getCompletedSavings = async (req, res) => {
  try {
    const user = req.user
    const findAcc = await User.findOne({ where: { id: user } })
    if (!findAcc) return res.json({ status: 404, msg: 'User not found' })
    const findSavings = await Savings.findAll({ where: { user: findAcc.id, status: ['terminated', 'complete'] },
     order:[['createdAt', 'DESC']]
    })
    if (!findSavings) return res.json({ status: 404, msg: 'Completed history not found' })
    return res.json({ status: 200, msg: 'Completed history found', data: findSavings })
  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }
}

exports.getUserSavings = async (req, res) => {
  try {
    const findAcc = await User.findOne({ where: { id: req.user } })
    if (!findAcc) return res.json({ status: 404, msg: 'Account not found' })
    const findSavings = await Savings.findAll({
      where: { user: findAcc.id },
      order:[['createdAt','DESC']]
    });
    if (!findSavings) return res.json({ status: 404, mag: "Savings not found" })
    return res.json({ status: 200, msg: 'savings fetched successfully', data: findSavings })
  } catch (error) {

  }
}

//user loans and cards
exports.createCards = async (req, res) => {
  try {
    const { type, card_no, name, cvv, exp } = req.body
    if (!type || !card_no || !name || !cvv || !exp) return res.json({ status: 404, msg: 'Incomplete request' })
    const findAcc = await User.findOne({ where: { id: req.user } })
    if (!findAcc) return res.json({ status: 404, msg: 'Account not found' })
    const cards = await Card.create({
      name,
      card_no,
      cvv,
      exp,
      type,
      userid: findAcc.id
    })
    await Notify.create({
      type: 'Card',
      message: `You have successfully created${Card.type}. Now you can proceed to withdraw with this card.`,
      user: findAcc.id
    })
    return res.json({ status: 200, msg: 'Card created successfully', cards })
  } catch (error) {
    ServerError(res, error)
  }
}

exports.getAllUserCards = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.user },
      include: [
        {
          model: Card, as: 'usercards'
        }
      ],
      attributes: {
        exclude: Excludes
      }
    })
    if (!user) return res.json({ status: 404, msg: 'User not found' })
    return res.json({ status: 200, msg: 'fetched successfully', user })
  } catch (error) {
    ServerError(res, error)
  }
}


exports.requestLoan = async (req, res) => {
  try {
    const { fullname, amount, duration } = req.body
    if (!fullname || !amount || !duration) return res.json({ status: 404, msg: "Incomplete request" })
    const findAcc = await User.findOne({ where: { id: req.user } })
    if (!findAcc) return res.json({ status: 404, msg: "Account not found" })
    const loan = await Loan.create({
      fullname,
      amount,
      duration,
      userid: findAcc.id
    })
    return res.json({ status: 200, msg: "Loan requested successfully", loan })
  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }
}




//getNofications and histories
exports.getTransHistory = async (req, res) => {
  try {
    if (!req.user) return res.json({ status: 400, msg: 'Unauthorized access' })
    const findAcc = await User.findOne({ where: { id: req.user } })
    if (!findAcc) return res.hson({ status: 404, msg: 'Account not found' })
    const findHistory = await TransHistory.findAll({
      where: { userid: findAcc.id },
      order: [['date', 'ASC']]
    })
    if (!findHistory) return res.json({ status: 404, msg: 'Transaction history not found' })
    return res.json({ status: 200, msg: 'Transaction history fetched successfully', data: findHistory })
  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }
}

exports.getUserNotifications = async (req, res) => {
  try {
    if (!req.user) return res.json({ status: 400, msg: 'Unauthorized access' })
    const findAcc = await User.findOne({ where: { id: req.user } })
    if (!findAcc) return res.hson({ status: 404, msg: 'Account not found' })
    const findNotify = await Notify.findAll({
      where: { user: findAcc.id },
      order: [['createdAt', 'DESC']]
    })
    if (!findNotify) return res.json({ status: 404, msg: 'Notifications not found' })
    return res.json({ status: 200, msg: 'Notifications fetched successfully', data: findNotify })
  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }
}

exports.MarkReadNotifications = async (req, res) => {
  try {
    const { id } = req.body
    if (!id) return res.json({ status: 404, msg: 'Notification ID is required' })
    const findAcc = await User.findOne({ where: { id: req.user } })
    if (!findAcc) return res.json({ status: 404, msg: 'Account not found' })
    const findNotification = await Notify.findOne({ where: { user: findAcc.id, id } })
    if (!findNotification) return res.json({ status: 404, msg: "Notification not found" })
    findNotification.status = 'read'
    await findNotification.save()
    return res.json({ status: 200, msg: 'Notification marked as read' })
  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }
}
exports.MarkAllAsRead = async (req, res) => {
  try {
    const findAcc = await User.findOne({ where: { id: req.user } })
    if (!findAcc) return res.json({ status: 404, msg: 'Account not found' })
    await Notify.update({ status: 'read' }, { where: { user: findAcc.id } });
    return res.json({ status: 200, msg: 'Notifications marked as read' })
  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }
}

//banks
exports.getBankList = async (req, res) => {
  try {
    const user = req.user
    if (!user) return res.json({ status: 404, msg: "Account not found" })
    const userBanks = await Banks.findAll({ where: { userid: user } })
    if (!userBanks) return res.json({ status: 404, msg: 'User banks not found' })
    return res.json({ status: 200, msg: 'Banks fetched successfully', data: userBanks })
  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }
}

exports.addBank = async (req, res) => {
  try {
    const { fullname, bank_name, account_no, account_type, route_no, swift, iban, bank_address } = req.body
    if (!fullname || !bank_name || !bank_address || !account_no || !account_type) return res.json({ status: 404, msg: 'Incomplete request' })
    const user = req.user
    if (!user) return res.json({ status: 404, msg: 'Account not found' })
    const createBank = await Banks.create({
      fullname, bank_name, bank_address, account_no, account_type, swift, iban, route_no, userid: user
    })
    return res.json({ status: 200, msg: 'Bank account added successfully', data: createBank })
  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }
}

exports.SubmitKYC = async (req, res) => {
  try {
    const findUserKyc = await KYC.findOne({ where: { userid: req.user, status: 'pending' } })
    if (findUserKyc) return res.json({ statsu: 404, msg: 'You already have submitted Kyc, please wait for approval' })
    const findApproveduser = await KYC.findOne({ where: { userid: req.user, status: 'verified' } })
    if (findApproveduser) return res.json({ status: 404, msg: 'Sorry, your account is already verified' })
    const { firstname, lastname, marital, dob, address, zip, id_type, id_number } = req.body
    if (!firstname) return res.json({ status: 404, msg: 'Firstname is required' })
    if (!lastname) return res.json({ status: 404, msg: 'Lastname is required' })
    if (!marital) return res.json({ status: 404, msg: 'Marital status is required' })
    if (!dob) return res.json({ status: 404, msg: 'Date of birth is required' })
    if (!address) return res.json({ status: 404, msg: 'Address is required is required' })
    if (!zip) return res.json({ status: 404, msg: 'Zip code is required' })
    if (!id_type) return res.json({ status: 404, msg: 'ID type is required' })
    if (!id_number) return res.json({ status: 404, msg: 'ID number is required' })
    const finduser = KYC.findOne({ where: { userid: req.user } })
    const findOwner = await User.findOne({ where: { id: req.user } })
    if (!findOwner) return res.json({ status: 404, msg: 'User not found' })
    if (!finduser) return res.json({ status: 404, msg: 'Unauthorized Access' })
    if (!req.files) return res.json({ status: 404, msg: 'ID images are required' })
    const frontimg = req?.files?.frontimg
    const backimg = req?.files?.backimg
    let imagefront;
    let imageback;
    const filepath = `./public/kycs/${firstname} ${lastname}'s kyc`

    if (frontimg) {
      if (frontimg.size >= 1000000) return res.json({ status: 404, msg: `Cannot upload up to 1MB` })
      if (!frontimg.mimetype.startsWith('image/')) return res.json({ status: 400, msg: `Invalid image format (jpg, jpeg, png, svg, gif, webp)` })
    }
    if (backimg) {
      if (backimg.size >= 1000000) return res.json({ status: 404, msg: `Cannot upload up to 1MB` })
      if (!backimg.mimetype.startsWith('image/')) return res.json({ status: 400, msg: `Invalid image format (jpg, jpeg, png, svg, gif, webp)` })
    }
    if (!fs.existsSync(filepath)) {
      fs.mkdirSync(filepath)
    }
    imagefront = `${slug(`${firstname} front ID`, '-')}.png`
    imageback = `${slug(`${firstname} back ID`, '-')}.png`
    const newKyc = await KYC.create({
      firstname,
      lastname,
      id_number,
      marital,
      dob,
      address,
      zip,
      id_type,
      status: 'pending',
      frontimg: imagefront,
      backimg: imageback,
      userid: req.user
    })

    findOwner.kyc_status = 'submitted'
    await findOwner.save()
    await frontimg.mv(`${filepath}/${imagefront}`)
    await backimg.mv(`${filepath}/${imageback}`)
    await Notify.create({
      type: 'Successful KYC submission',
      message: `Your have successfully submitted your kyc,kindly wait for approval.`,
      status: 'unread',
      user: req.user
    })
    return res.json({ status: 200, msg: 'Kyc details submitted successfully', data: newKyc })
  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }
}

//create transfers

exports.CreateTransfer = async (req, res) => {
  try {
    const { acc_no, acc_name, bank_name, route, amount } = req.body
    if (!acc_name || !acc_no || !bank_name || !amount) return res.json({ status: 404, msg: "Incomplete request" })
    const findUser = await User.findOne({ where: { id: req.user } })
    if (!findUser) return res.json({ status: 404, msg: 'User not found' })
    findPendingTransfer = await Transfer.findOne({ where: { userid: findUser.id, status: 'pending' } })
    if (findPendingTransfer) return res.json({ status: 404, msg: 'Sorry you have a pending transaction, wait for completion before proceeding with new one' })
    if (amount > findUser.balance) return res.json({ status: 404, msg: "Insufficient funds" })
    findUser.balance = parseFloat(findUser.balance) - parseFloat(amount)
    const transfer = await Transfer.create({
      acc_name, acc_no, bank_name, route, amount, userid: findUser.id
    })
    const idRef = otpgenerator.generate(20, { specialChars: false, lowerCaseAlphabets: false })
    await TransHistory.create({
      type: 'Withdraw',
      amount: amount,
      status: 'success',
      date: moment().format('DD-MM-YYYY hh:mmA'),
      message: `You have initiated a withdrawal sum of ${findUser.currency}${amount}  to an external bank account, kindly wait for completion.  `,
      transaction_id: idRef,
      userid: findUser.id
    })
    await Notify.create({
      type: 'Transfer',
      message: `You have successfully initiated a transfer of ${findUser.currency}${amount}. pending approval.`,
      user: findUser.id
    })
    await findUser.save()

    await sendMail({
      mailTo: findUser.email,
      username: findUser.firstname,
      subject: 'External Bank Transfer',
      date: moment().format('DD-MM-YYYY hh:mm A'),
      template: 'withdrawal',
      receiver: acc_name,
      bankName: bank_name,
      accountNo: acc_no,
      amount: `${findUser.currency}${amount}`
    })
    return res.json({ status: 200, msg: "Transfer created successfully", data: findUser })
  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }
}

exports.getTransfers = async (req, res) => {
  try {
    const user = req.user
    if (!user) return res.json({ status: 404, msg: "Account not found" })
    const findTransfers = await Transfer.findAll({
      where: { userid: user, status: 'pending' },
      include: [
        {
          model: User, as: 'usertransfers',
          attributes: { exclude: Excludes }
        },
        { model: Verification, as: 'verifications' },
      ]
    })
    if (!findTransfers) return res.json({ status: 404, msg: 'Transfers not found' })
    return res.json({ status: 200, msg: 'fetched success', data: findTransfers })
  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }
}
exports.getVerifications = async (req, res) => {
  try {
    const user = req.user
    if (!user) return res.json({ status: 404, msg: "Account not found" })
    const findVerifications = await Verification.findOne({ where: { userid: user } })
    if (!findVerifications) return res.json({ status: 404, msg: 'Verifications not found' })
    return res.json({ status: 200, msg: 'fetched success', data: findVerifications })
  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }
}

exports.getAdminBanks = async (req, res) => {
  try {
    const findUser = await User.findOne({ where: { id: req.user } })
    if (!findUser) return res.json({ status: 404, msg: 'Unauthorized access to this route' })
    const banks = await adminBank.findAll({ where: { hidden: 'false' } })
    if (!banks) return res.json({ status: 404, msg: 'Banks not found' })
    return res.json({ status: 200, msg: 'fetched successfully', data: banks })
  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }
}


exports.SubmitTransferProof = async (req, res) => {
  try {
    const { id } = req.body
    if (!id) return res.json({ status: 404, msg: 'Verification ID missing' })
    if (!req.files) return res.json({ status: 404, msg: 'Proof of payment is required' });
    const user = req.user
    const findAcc = await User.findOne({ where: { id: req.user } });
    if (!findAcc) return res.json({ status: 404, msg: "Account not found" });
    const findVerify = await Verification.findOne({ where: { id } })
    if (!findVerify) return res.json({ status: 404, msg: "Verification ID missing" });

    // console.log(findVerify)
    const image = req?.files?.image;
    let imageName;

    if (image) {
      if (image.size >= 1000000) return res.json({ status: 404, msg: `Cannot upload up to 1MB` });
      if (!image.mimetype.startsWith('image/')) return res.json({ status: 400, msg: `Invalid image format (jpg, jpeg, png, svg, gif, webp)` });
    }

    const filepath = `./public/transfers/`;
    if (!fs.existsSync(filepath)) {
      fs.mkdirSync(filepath, { recursive: true });
    }

    const files = fs.readdirSync(filepath);
    const nextFileNumber = files.length + 1;
    imageName = `${slug(findAcc.firstname)}-transfer-${nextFileNumber}.jpg`;
    findVerify.image = imageName
    await findVerify.save()
    await image.mv(path.join(filepath, imageName));
    return res.json({ status: 200, msg: 'Proof of payment upload success' });
  } catch (error) {
    return res.json({ status: 500, msg: error.message });
  }
};

exports.getAllTransfers = async (req, res) => {
  try {
    const findAcc = await User.findOne({ where: { id: req.user } });
    if (!findAcc) return res.json({ status: 404, msg: "Account not found" });
    const transfer = await Transfer.findAll({
      where: { userid: findAcc.id },
      include: [
        {
          model: User, as: 'usertransfers',
          attributes: { exclude: Excludes }
        },
        { model: Verification, as: 'verifications' }
      ]
    })
    if (!transfer) return res.json({ status: 404, msg: "Transfer not found" })
    return res.json({ status: 200, msg: 'success', data: transfer })
  } catch (error) {
    return res.json({ status: 500, msg: error.message });
  }
}

exports.contactUs = async (req, res) => {
  try {
    const { name, email, message, subject } = req.body
    if (!message) return res.json({ status: 404, msg: 'Message is missing' })
    await Contact.create({ name, email, message, subject })
    return res.json({ status: 200, msg: "Message sent" })
  } catch (error) {
    return res.json({ status: 500, msg: error.message });
  }
}
exports.NewsLetterSubscription = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.json({ status: 404, msg: 'Email is missing' })
    const checkmail = await NewsLetter.findOne({ where: { email } })
    if (checkmail) return res.json({ status: 404, msg: "Email already subscribed" })
    await NewsLetter.create({ email })
    return res.json({ status: 200, msg: "Subscribes successfully" })
  } catch (error) {
    return res.json({ status: 500, msg: error.message });
  }
}






















exports.Testmail = async (req, res) => {
  try {

    const otp = otpgenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false })
    await sendMail({ code: otp, mailTo: 'mrlite402@gmail.com', subject: 'Account Verification Code', username: `Bethel`, message: 'Copy and paste your account verification code below', template: 'verification', fullname: `Bethel Nnadi`, email: 'mrlite402@gmail.com', date: moment().format('DD MMMM YYYY hh:mm A') })
    return res.json({ status: 200, msg: 'Test email sent successfully' })
  } catch (error) {
    res.json({ status: 500, msg: error.message })
  }
}