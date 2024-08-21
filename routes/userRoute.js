const { userMiddleware } = require('../auth/UserAuth')
const { SignupUserAccount, GetUserProfile, LoginAcc, logOutUser, GetAllSavings, CreateSavings, getAllCurrentSavings, requestLoan, ChangeProfileImage, EditProfile, TopUp, getTransHistory, DeleteGoal, createCards, getAllUserCards, getUserNotifications, MarkReadNotifications, findUserAccount, ChangeUserPassword, ChangeAccountEmail, RequestEmailOtp, MarkAllAsRead, getBankList, addBank, Deposit, CreateTransfer, getTransfers, getVerifications, getAdminBanks, SubmitTransferProof, getAllTransfers, getUserSavings, contactUs, NewsLetterSubscription, verifyOtp, VerifyEmail, ResendOtp, Testmail, VerifyPasswordChange, WithdrawGoal, getCompletedSavings } = require('../controllers/userController')

const router = require('express').Router()

router.post('/signup', SignupUserAccount)
router.post('/verify-email', VerifyEmail)
router.post('/verify-emailpass', VerifyPasswordChange)
router.post('/change-pass', ChangeUserPassword)
router.post('/resend-otp', ResendOtp)
router.post('/login', LoginAcc)
router.post('/contact', contactUs)
router.post('/email-subscribe', NewsLetterSubscription)
router.post('/logout', userMiddleware, logOutUser)
router.post('/find-account', findUserAccount)
router.post('/change-password', userMiddleware, ChangeUserPassword)
router.post('/email-otp', userMiddleware, RequestEmailOtp)
router.post('/change-email', userMiddleware, ChangeAccountEmail)
router.post('/all-read', userMiddleware, MarkAllAsRead)
router.post('/verify-otp', userMiddleware, verifyOtp)
router.post('/testmail', Testmail)

//savings
router.get('/user-savings', userMiddleware, GetAllSavings)
router.post('/upload-img', ChangeProfileImage)
router.get('/profile', userMiddleware, GetUserProfile)
router.post('/edit-profile', EditProfile)
router.post('/create-savings', userMiddleware, CreateSavings)
router.post('/delete-savings', userMiddleware, DeleteGoal)
router.get('/total-savings', userMiddleware, getAllCurrentSavings)
router.post('/top-up', userMiddleware, TopUp)
router.post('/deposit', userMiddleware, Deposit)
router.get('/all-savings', userMiddleware, getUserSavings)
router.post('/withdraw-savings', userMiddleware, WithdrawGoal)
router.get('/save-history', userMiddleware, getCompletedSavings)

//loans/cards/banks/transfers
router.post('/create-card', userMiddleware, createCards)
router.get('/user-cards', userMiddleware, getAllUserCards)
router.get('/request-loan', userMiddleware, requestLoan)
router.get('/get-user-banks', userMiddleware, getBankList)
router.post('/add-bank', userMiddleware, addBank)
router.post('/transfer', userMiddleware, CreateTransfer)
router.get('/find-transfers', userMiddleware, getTransfers)
router.get('/find-verifications', userMiddleware, getVerifications)
router.get('/admin-banks', userMiddleware, getAdminBanks)
router.get('/user-transfers', userMiddleware, getAllTransfers)
router.post('/upload-proof', userMiddleware, SubmitTransferProof)


//transhistory and notifications
router.get('/trans-history', userMiddleware, getTransHistory)
router.get('/user-notifications', userMiddleware, getUserNotifications)
router.post('/mark-read', userMiddleware, MarkReadNotifications)

module.exports = router