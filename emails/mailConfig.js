"use strict";
const nodemailer = require("nodemailer");
const hbs = require('nodemailer-express-handlebars')
const path = require('path')
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: process.env.MAIL_SECURE,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});


const options = {
  viewEngine: {
    extName: '.handlebars',
    partialsDir: path.resolve('./emails'),
    defaultLayout: false
  },
  viewPath: path.resolve('./emails'),
  extName: '.handlebars'
}

transporter.use('compile', hbs(options))

// async..await is not allowed in global scope, must use a wrapper
const SendMail = async ({mailTo, subject, username,goaltarget,receiver,accountNo,date,email, message,fullname, code, template, goalcurrent,goalname, amount, topupamount, bankName}) => {
  try {
     await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: mailTo,
      // to: "bar@example.com, baz@example.com", // list of receivers
      subject: subject,
      template,
      context: {
        username,
        message,
        code,
        amount,
        receiver,
        goalname,
        goalcurrent,
        goaltarget,
        date,
        accountNo,
        email,
        bankName,
        topupamount,
        fullname
      }
    });
  } catch (error) {
    console.log(error)
  }
}

module.exports = SendMail
