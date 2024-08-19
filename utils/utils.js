

exports.ServerError = (res, error) => {
    return res.json({status: 500, msg: `Something went wrong on our end, try again later.`, stack: `${error}`})
}
exports.Excludes = [
    "dial_code",
    "phone",
    "password",
    "reset_code",
    "status",
    "pin",
    "refid",
    "upline",
    "gender",
    "verified",
    "suspended",
    "lastlogin",
    "account_number",
    "country",
    "state",
    "createdAt",
    "updatedAt",
]
exports.ExcludeNames = ['password', 'role', 'resetcode']