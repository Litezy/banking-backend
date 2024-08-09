const { ServerError, Excludes } = require("../utils/utils")
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
    const ExcludeNames = ['password', 'role', 'resetcode']
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
    return res.json({ status: 200, msg: 'profile image uploaded successfully' })
  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }
}


exports.VerifyEmail = async (req, res) => {

  try {
    const { reset_code, email } = req.body
    if (!reset_code || !email) return res.json({ status: 404, msg: 'Incomplete Request' })
    const FindEmail = await User.findOne({ where: { email: email } })
    if (!FindEmail) return res.json({ status: 404, msg: 'Account not found' })
    if (reset_code !== FindEmail.reset_code) return res.json({ status: 404, msg: 'Invalid code' })
    FindEmail.reset_code = null
    FindEmail.email_verified = 'true'
    await FindEmail.save()
    return res.json({ status: 200, msg: 'Email verified successfully' })

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
    const otp = otpgenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false })
    const content = `<div>
    <p>hi dear, please verify your email with the code below</p>
    <div style="  padding: 1rem; background-color: red; width: 100%; dislpay:flex; align-items: center;
    justify-content: center;">
    <h3 style="font-size: 1.5rem">${otp}</h3>
    </div>
    </div>`
    findEmail.reset_code = otp
    await findEmail.save()
    await sendMail({ from: 'myonlineemail@gmail.com', to: email, subject: 'Email Verification', html: content })
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
      user: req.user
    })
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
    finduser.email = new_email
    await finduser.save()
    await Notify.create({
      type: 'Account Email Change',
      message: `Your request to change your account email was successful.`,
      status: 'unread',
      user: req.user
    })
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
    const otp = otpgenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false })
    const content = `<div>
    <p>hi dear, please verify your email with the code below</p>
    <div style="  padding: 1rem; background-color: red; width: 100%; dislpay:flex; align-items: center;
    justify-content: center;">
    <h3 style="font-size: 1.5rem">${otp}</h3>
    </div>
    </div>`
    findEmail.reset_code = otp
    await findEmail.save()
    await sendMail({ from: 'myonlineemail@gmail.com', to: email, subject: 'Email Verification', html: content })
    res.json({ status: 200, msg: 'OTP resent successfuly' })
  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }
}


exports.EditProfile = async (req, res) => {
  try {
    const { firstname, lastname, phone, country, state, email } = req.body
    if (!email) return res.json({ status: 404, msg: 'Email is required' })
    const findAcc = await User.findOne({ where: { email } })
    if (!findAcc) return res.json({ status: 404, msg: 'Account not found' })
    if (firstname) findAcc.firstname = firstname;
    if (lastname) findAcc.lastname = lastname;
    if (state) findAcc.state = state;
    if (phone) findAcc.phone = phone;
    if (country) findAcc.country = country;
    await findAcc.save()
    return res.json({ status: 200, msg: 'Profile edit success' })
  } catch (error) {
    console.error('Error editing profile:', error);
    return res.json({ status: 500, msg: error.message })
  }
}

//Savings Controllers
exports.GetAllSavings = async (req, res) => {
  try {
    const findUser = await User.findOne({ where: { id: req.user } })
    if (!findUser) return res.json({ status: 404, msg: 'Unauthorized account' })
    const findUserSavings = await Savings.findAll({
      where: { user: findUser.id },
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
    const { firstname } = req.body;
    if (!firstname) return res.json({ status: 404, msg: 'Fullname is required' });
    if (!req.files) return res.json({ status: 404, msg: 'Proof of payment is required' });

    const findAcc = await User.findOne({ where: { id: req.user } });
    if (!findAcc) return res.json({ status: 404, msg: "Account not found" });

    const image = req.files.image;
    let imageName;

    if (image) {
      if (image.size >= 1000000) return res.json({ status: 404, msg: `Cannot upload up to 1MB` });
      if (!image.mimetype.startsWith('image/')) return res.json({ status: 400, msg: `Invalid image format (jpg, jpeg, png, svg, gif, webp)` });
    }

    const filepath = `./public/deposits/${firstname}`;
    if (!fs.existsSync(filepath)) {
      fs.mkdirSync(filepath, { recursive: true });
    }
    const files = fs.readdirSync(filepath);
    const nextFileNumber = files.length + 1;
    imageName = `${slug(firstname)}-deposit-${nextFileNumber}.jpg`;

    await Deposit.create({
      image: imageName,
      userid: findAcc.id // Ensure you are storing the user ID correctly
    });

    await image.mv(path.join(filepath, imageName));

    return res.json({ status: 200, msg: 'Proof of payment upload success' });
  } catch (error) {
    return res.json({ status: 500, msg: error.message });
  }
};

exports.CreateSavings = async (req, res) => {
  try {
    const { goal, name, current } = req.body;
    if (!goal || !name) return res.json({ status: 404, msg: 'Incomplete savings request' });

    const findAcc = await User.findOne({ where: { id: req.user } });
    if (!findAcc) return res.json({ status: 404, msg: 'Account not found' });

    if (current) {
      if (current > findAcc.balance) return res.json({ status: 404, msg: 'Insufficient balance' });
      findAcc.balance = findAcc.balance - current;
    }

    let currency;
    try {
      const response = await axios.get(`https://restcountries.com/v3.1/name/${findAcc?.country}`);
      if (response.data && response.data.length > 0) {
        const countryData = response.data[0];
        const currencySymbol = Object.values(countryData.currencies)[0].symbol;
        currency = currencySymbol;
      } else {
        console.error('Unexpected response format:', response);
      }
    } catch (apiError) {
      console.error('Error fetching currency:', apiError);
      return res.status(500).json({ status: 500, msg: 'Failed to fetch currency information' });
    }

    const save = await Savings.create({
      goal,
      name,
      current,
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
        message: `You have successfully created a savings goal with a target of ${currency}${goal}. ${current ? `With an initial saving of ${currency}${current}.` : ''}. Stay committed and watch your savings grow! Congratulations.`,
        transaction_id: idRef,
        userid: findAcc.id,
      });
    }

    await Notify.create({
      type: 'Goal Savings',
      message: 'You have successfully created a savings goal, kindly check your savings account for more details.',
      user: findAcc.id,
    });

    return res.json({ status: 200, msg: 'Savings created successfully', save, history });
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
    const findAcc = await User.findOne({ where: { id: req.user } })
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
    findSaving.current = parseFloat(findSaving.current) + topUpAmount;
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
    return res.json({ status: 200, msg: 'Top up success' })
  } catch (error) {
    return res.json({ status: 500, msg: error.message })
  }
}

exports.DeleteGoal = async (req, res) => {
  try {
    const { id } = req.body
    if (!id) return res.json({ status: 404, msg: 'Savings ID required' })
    const findAcc = await User.findOne({ where: { id: req.user } })
    if (!findAcc) return res.json({ status: 404, msg: 'Account not found' })
    const findSaving = await Savings.findOne({ where: { user: findAcc.id } })
    if (!findSaving) return res.json({ status: 404, msg: 'Savings not found' })
    findAcc.balance = findAcc.balance + findSaving.current
    await findAcc.save()
    await findSaving.destroy()
    await Notify.create({
      type: 'Savings deletion',
      message: `You have successfully deleted your ${findSaving.name} savings goal, and your currents savings sum has been added back to your account balance.`,
      user: findAcc.id
    })
    return res.json({ status: 200, msg: 'Savings successfully deleted' })
  } catch (error) {
    return res.json({ status: 500, msg: error.message })
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
      order: [['date', 'DESC']]
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
    const { firstname, lastname,  marital, dob, address, zip, id_type, id_number } = req.body
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