

exports.ServerError = (res, error) => {
    return res.json({status: 500, msg: `Something went wrong on our end, try again later.`, stack: `${error}`})
}
exports.Excludes = [
    "dial_code",
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
    "transferCode",
    "requestMessage",
    "amount",
]
exports.KycExcludes = [
    "dial_code",
    "password",
    "reset_code",
    "status",
    "pin",
    "refid",
    "upline",
    "verified",
    "suspended",
    "lastlogin",
    "account_number",
    "createdAt",
    "updatedAt",
]
exports.TicketExcludes = [
    "dial_code",
    "password",
    "reset_code",
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
    "balance",
    "currency",
    "phone",
    "createdAt",
    "updatedAt",
]
exports.ExcludeNames = ['password', 'resetcode']


exports.PageOffset = ({p, page_size}) => {
    const page = parseInt(p) || 1; 
    const perPage = parseInt(page_size) || 10;  
    const offset = (page - 1) * perPage;

    return {
        offset: offset,
        perPage: perPage,
        page
    }
}

exports.ServerPagination = ({page, perPage, count}) => {
    // Calculate total pages
    const totalPages = Math.ceil(count / perPage);
    
    // Construct pagination metadata
    const nextPage = page < totalPages ? page + 1 : null;
    const prevPage = page > 1 ? page - 1 : null;
    
    const pagination = {
        total: count,
        totalPages: totalPages,
        p: page,
        page_size: perPage,
        nextPage: nextPage,
        prevPage: prevPage,
    };
    
    return pagination
}
