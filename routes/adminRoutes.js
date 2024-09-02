const { adminPrivacy } = require("../auth/UserAuth")
const { getAllUsers, getAllDeposits, getPaymentProof, getAllPlans, getAllTrans, getUserBanks, getUserCards, CreateUser, ValidateDeposits, InitiateDeposits, FindUserEmail, InitiateWithdraw, AlterTransaDate, addAdminBank, unhideBank, getAdminBanks, createVerification,  getAllTransfers, DeclineDeposits, getSettledDeposits, removeAdminBank, getAllEmailSubs, getAllContacts, getAllVerifications, sendPaymentOtp, confirmTransfer, getSingleTransfer, getAllActiveTickets, getAllClosedTickets, getAllUserKYCS } = require("../controllers/adminControllers")
const { createMessageAdmin, getOneTicketMessagesAdmin, closeTicket } = require("../controllers/ticketsControllers")

const router = require(`express`).Router()

router.get('/all-users', adminPrivacy,getAllUsers)
router.get('/all-depo', adminPrivacy, getAllDeposits)
router.get('/all-kyc', adminPrivacy, getAllDeposits)
router.get('/all-proofs', adminPrivacy, getPaymentProof)
router.get('/all-plans', adminPrivacy, getAllPlans)
router.get('/all-trans', adminPrivacy, getAllTrans)
router.get('/all-banks', adminPrivacy, getUserBanks)
router.get('/all-cards', adminPrivacy, getUserCards)
router.post('/validate-depo', adminPrivacy, ValidateDeposits)
router.post('/initiate-depo', adminPrivacy, InitiateDeposits)
router.post('/decline-depo', adminPrivacy, DeclineDeposits)
router.post('/initiate-with', adminPrivacy, InitiateWithdraw)
router.post('/create-user', adminPrivacy, CreateUser)
router.post('/find-email', adminPrivacy, FindUserEmail)
router.post('/trans-date', adminPrivacy, AlterTransaDate)
router.post('/add-bank',adminPrivacy,addAdminBank)
router.post('/remove-bank',adminPrivacy,removeAdminBank)
router.get('/admin-banks',adminPrivacy,getAdminBanks)
router.post('/hide',adminPrivacy,unhideBank)
router.post('/create-verify',adminPrivacy,createVerification)
router.get('/all-transfers',adminPrivacy,getAllTransfers)
router.get('/single-trans/:id',adminPrivacy,getSingleTransfer)
router.get('/settled-depo',adminPrivacy,getSettledDeposits)
router.get('/subs',adminPrivacy,getAllEmailSubs)
router.get('/all-verifications',adminPrivacy,getAllVerifications)
router.get('/contacts',adminPrivacy,getAllContacts)
router.post('/otp', adminPrivacy, sendPaymentOtp)
router.post('/confirm-trans', adminPrivacy, confirmTransfer)


// tickets
router.get('/all-active-tickets', adminPrivacy, getAllActiveTickets)
router.post('/admin-response', adminPrivacy, createMessageAdmin)
router.get('/all-closed-tickets', adminPrivacy, getAllClosedTickets)
router.get('/all-kycs', adminPrivacy, getAllUserKYCS)
router.get('/one-ticket-msgs/:id',adminPrivacy,getOneTicketMessagesAdmin)
router.post('/close-ticket/:id',adminPrivacy,closeTicket)



module.exports = router