const { adminPrivacy } = require("../auth/UserAuth")
const { getAllUsers, getAllDeposits, getPaymentProof, getAllPlans, getAllTrans, getUserBanks, getUserCards, CreateUser } = require("../controllers/adminControllers")

const router = require(`express`).Router()

router.get('/all-users', adminPrivacy,getAllUsers)
router.get('/all-depo', adminPrivacy, getAllDeposits)
router.get('/all-kyc', adminPrivacy, getAllDeposits)
router.get('/all-proofs', adminPrivacy, getPaymentProof)
router.get('/all-plans', adminPrivacy, getAllPlans)
router.get('/all-trans', adminPrivacy, getAllTrans)
router.get('/all-banks', adminPrivacy, getUserBanks)
router.get('/all-cards', adminPrivacy, getUserCards)
router.post('/create-user', adminPrivacy, CreateUser)

module.exports = router