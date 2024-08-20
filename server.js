
const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const bodyparser = require('body-parser')
const fileUpload = require('express-fileupload')

dotenv.config()

const app = express()

const port = process.env.PORT

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001','http://localhost:3002','http://localhost:3003', "https://greenfordbank.com"]
}));


app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());
app.use(fileUpload())
app.use(express.static('public'))
app.use('/user', require('./routes/userRoute'))
app.use('/admin', require('./routes/adminRoutes'))

app.listen(port, () => console.log(`server running on http://localhost:${port}`))
