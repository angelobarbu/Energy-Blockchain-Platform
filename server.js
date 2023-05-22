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

app.set('view engine', 'ejs')

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

var username
var userId

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
            return res.render('home')
        } else {
            console.log("Wrong password")
            return res.redirect('/login-fail.html')
        }
    } else {
        console.log("Username does not exist")
        return res.redirect('/login-fail.html')
    }

})

app.get('/home', async (req, res) => {
    return res.render('home')
})


// Afisarea contractelor din baza de date pentru utilizatorul autentificat
app.get('/contracts', async (req, res) => {
    try {
        var contracts = await database.collection('contracts').find({
            $or: [
                { seller_id: userId },
                { buyer_id: userId }
            ]
        }).toArray()
    } catch (error) {
        console.log(error)
    }

    if (contracts.length) {

        for (var i = 0; i < contracts.length; i++) {
            try {
                var seller_id = contracts[i]['seller_id']
                var seller = await database.collection('users').findOne({ _id: seller_id })
                var seller_username = seller['username']
            } catch (error) {
                console.log(error)
            }
            contracts[i]['seller_username'] = seller_username

            try {
                var buyer_id = contracts[i]['buyer_id']
                var buyer = await database.collection('users').findOne({ _id: buyer_id })
                var buyer_username = buyer['username']
            } catch (error) {
                console.log(error)
            }
            contracts[i]['buyer_username'] = buyer_username
        }

        return res.render('contracts', { contracts: contracts })
    } else {
        contracts[0] = {
            buyer_username: 'Nu exista contracte'
        }
        return res.render('contracts', { contracts: contracts })
    }

})

app.get('/account', async (req, res) => {
    try {
        var account = await database.collection('users').findOne({ _id: userId })
    } catch (error) {
        console.log(error)
    }

    console.log(account)

    return res.render('account', { account: account })
})

app.post('/change-name' , async (req, res) => {
    try {
        var user = await database.collection('users').findOne({ _id: userId })
        var newUser = user;
        newUser['name'] = req.body['change-name']
        try {
            await database.collection('users').updateOne({ _id: userId }, { $set: newUser })
        } catch (error) {
            console.log(error)
        }
    } catch (error) {
        console.log(error)
    }
    return res.render('account', { account: newUser })
})

app.post('/change-email' , async (req, res) => {
    try {
        var user = await database.collection('users').findOne({ _id: userId })
        var newUser = user;
        newUser['email'] = req.body['change-email']
        try {
            await database.collection('users').updateOne({ _id: userId }, { $set: newUser })
        } catch (error) {
            console.log(error)
        }
    } catch (error) {
        console.log(error)
    }
    return res.render('account', { account: newUser })
})

app.post('/change-phone' , async (req, res) => {
    try {
        var user = await database.collection('users').findOne({ _id: userId })
        var newUser = user;
        newUser['phone'] = req.body['change-phone']
        try {
            await database.collection('users').updateOne({ _id: userId }, { $set: newUser })
        } catch (error) {
            console.log(error)
        }
    } catch (error) {
        console.log(error)
    }
    return res.render('account', { account: newUser })
})

app.post('/change-address' , async (req, res) => {
    try {
        var user = await database.collection('users').findOne({ _id: userId })
        var newUser = user;
        newUser['address'] = req.body['change-address']
        try {
            await database.collection('users').updateOne({ _id: userId }, { $set: newUser })
        } catch (error) {
            console.log(error)
        }
    } catch (error) {
        console.log(error)
    }
    return res.render('account', { account: newUser })
})

app.post('/change-wallet' , async (req, res) => {
    try {
        var user = await database.collection('users').findOne({ _id: userId })
        var newUser = user;
        newUser['wallet_address'] = req.body['change-wallet']
        try {
            await database.collection('users').updateOne({ _id: userId }, { $set: newUser })
        } catch (error) {
            console.log(error)
        }
    } catch (error) {
        console.log(error)
    }
    return res.render('account', { account: newUser })
})

app.post('/change-password' , async (req, res) => {
    try {
        var user = await database.collection('users').findOne({ _id: userId })
        var newUser = user;
        newUser['name'] = req.body['change-name']
        try {
            await database.collection('users').updateOne({ _id: userId }, { $set: newUser })
        } catch (error) {
            console.log(error)
        }
    } catch (error) {
        console.log(error)
    }
    return res.render('account', { account: newUser })
})

// Afisarea tranzactiilor de vanzare si cumparare din baza de date
// pentru utilizatorul autentificat
app.get('/transactions', async (req, res) => {
    // Preluare tranzactii de vanzare
    try {
        var transactions = await database.collection('transactions').find({ seller_id: userId, closed: 1 }).toArray()
    } catch (error) {
        console.log(error)
    }
    for (var i = 0; i < transactions.length; i++) {
        try {
            var buyer_id = transactions[i]['buyer_id']
            var buyer = await database.collection('users').findOne({ _id: buyer_id })
            var buyer_username = buyer['username']
        } catch (error) {
            console.log(error)
        }
        transactions[i]['buyer_seller_username'] = buyer_username
        transactions[i]['type'] = 'Vanzare'
    }

    // Preluare tranzactii de cumparare
    try {
        var buying_transactions = await database.collection('transactions').find({ buyer_id: userId, closed: 1 }).toArray()
    } catch (error) {
        console.log(error)
    }
    for (var i = 0; i < buying_transactions.length; i++) {
        try {
            var seller_id = buying_transactions[i]['seller_id']
            var seller = await database.collection('users').findOne({ _id: seller_id })
            var seller_username = seller['username']
        } catch (error) {
            console.log(error)
        }
        buying_transactions[i]['buyer_seller_username'] = seller_username
        buying_transactions[i]['type'] = 'Cumparare'
    }

    // Trimitere la frontend a tranzactiilor de vanzare si cumparare
    if (transactions.length && buying_transactions.length) {
        for (var i = 0; i < buying_transactions.length; i++) {
            transactions[transactions.length + 1] = buying_transactions[i]
        }
        console.log('Ambele')
        return res.render('transactions', { transactions: transactions })
    } else if (transactions.length && !buying_transactions.length) {
        console.log('Vanzare')
        return res.render('transactions', { transactions: transactions })
    } else if (!transactions.length && buying_transactions.length) {
        console.log('Cumparare')
        return res.render('transactions', { transactions: buying_transactions })
    } else if (!transactions.length && !buying_transactions.length) {
        console.log('Nu exista tranzactii incheiate')
        transactions[0] = {
            'type': 'Nu exista tranzactii incheiate'
        }
        return res.render('transactions', { transactions: transactions })
    }
})