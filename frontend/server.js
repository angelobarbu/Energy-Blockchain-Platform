// Barbu Angelo-Gabriel
// Universitatea Politehnica Bucuresti
// Facultatea de Automatica si Calculatoare
// Lucrare de licenta - iulie 2023
// Sistem blockchain pentru trasabilitatea și certificarea resurselor energetice

const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

const app = express()

app.use(bodyParser.json())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))

// Rularea serverului pe portul 3000
app.get('/', (req, res) => {
    res.set({
        'Allow-access-Allow-Origin': '*'
    })
    return res.redirect('index.html')
}).listen(3000)

console.log('Server is running on port 3000')

// Conectarea la baza de date MongoDB
mongoose.connect('mongodb+srv://angelobarbu:5jnlegmqWryv6qtF@platformdb.dh4ypq7.mongodb.net/', {
    dbName: 'transactions_platform',
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to DB')
}).catch((error) => {
    console.log(error)
})

var database = mongoose.connection

// Adaugarea utilizatorului in baza de date in urma inregistrarii
app.post('/signup', async (req, res) => {
    var inputUsername = req.body['signup-username']
    var inputName = req.body['signup-name']
    var inputEmail = req.body['signup-email']
    var inputPhone = req.body['signup-phone']
    var inputAddress = req.body['signup-address']
    var inputWalletAddress = req.body['signup-wallet-address']
    var inputPassword = req.body['signup-password']

    try {
        var user = await database.collection('users').findOne({ username: inputUsername })
    } catch (error) {
        console.log(error)
    }

    if (user) {
        console.log("Username already exists")
        return res.redirect('/signup-fail.html')
    }

    var data = {
        "username": inputUsername,
        "name": inputName,
        "email": inputEmail,
        "phone": inputPhone,
        "address": inputAddress,
        "wallet_address": inputWalletAddress,
        "password": inputPassword
    }
    await database.collection('users').insertOne(data, (err, collection) => {
        if (err)
            throw err
        console.log("Record inserted successfully")
    })
    return res.redirect('/signup-success.html')
})

var username;
var userId;

// Autentificarea utilizatorului in urma logarii si retinerea id-ului acestuia
app.post('/login', async (req, res) => {
    var inputUsername = req.body['login-username']
    var inputPassword = req.body['login-password']

    try {
        var user = await database.collection('users').findOne({ username: inputUsername })
    } catch (error) {
        console.log(error)
    }

    if (user) {
        if (user['password'] === inputPassword) {
            console.log("Login successful")
            username = user['username']
            userId = user['_id']
            return res.redirect('/home.html')
        } else {
            console.log("Wrong password")
            return res.redirect('/login-fail.html')
        }
    } else {
        console.log("Username does not exist")
        return res.redirect('/login-fail.html')
    }

})

app.get('/closed-transactions', async (req, res) => {
    $html = '';
    try {
        var closed_transactions = await database.collection('transactions').find({ _id: seller_id, closed: 1 }).toArray()
        console.log(closed_transactions)
    } catch (error) {
        console.log(error)
    }

    closed_transactions.foreach( async (transaction) => {
        try {
            var buyer_username = await database.collection('users').findOne({ _id: transaction['buyer_id'] })['username']
            console.log(buyer_username)
        } catch (error) {
            console.log(error)
        }
        $html += '<tr>'
        $html += '<td>' + 'Vanzare' + '</td>'
        $html += '<td>' + transaction['asset_description'] + '</td>'
        $html += '<td>' + transaction['price'] + '</td>'
        $html += '<td>' + transaction['quantity'] + '</td>'
        $html += '<td>' + transaction['delivery_date'] + '</td>'
        $html += '<td>' + buyer_username + '</td>'
        $html += '<td>' + transaction['transaction_hash'] + '</td>'
        $html += '</tr>'
        document.getElementById('closed-transactions-table-body').innerHTML = $html
    })
})