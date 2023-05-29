// Barbu Angelo-Gabriel
// Universitatea Politehnica Bucuresti
// Facultatea de Automatica si Calculatoare
// Lucrare de licenta - iulie 2023
// Sistem blockchain pentru trasabilitatea și certificarea resurselor energetice

const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const { spawn } = require('child_process')

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
            return res.redirect('/home')
        } else {
            console.log("Wrong password")
            return res.redirect('/login-fail.html')
        }
    } else {
        console.log("Username does not exist")
        return res.redirect('/login-fail.html')
    }

})



// Afisare tranzactii globale deschise in prima pagina
app.get('/home', async (req, res) => {
    try {
        var open_transactions = await database.collection('transactions').find({ closed: 0, seller_id: { $ne: userId } }).toArray()
    } catch (error) {
        console.log(error)
    }

    //console.log(open_transactions)

    if (!open_transactions.length) {
        open_transactions[0] = {
            asset_description: 'Nu exista tranzactii deschise'
        }
        return res.render('home', { open_transactions: open_transactions })
    }

    //console.log(open_transactions)

    for (var i = 0; i < open_transactions.length; i++) {
        try {
            var seller_id = open_transactions[i]['seller_id']
            var seller = await database.collection('users').findOne({ _id: seller_id })
            var seller_username = seller['username']
        } catch (error) {
            console.log(error)
        }
        open_transactions[i]['seller_username'] = seller_username
    }

    return res.render('home', { open_transactions: open_transactions })

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



// Afisare date cont utilizator
app.get('/account', async (req, res) => {
    try {
        var user = await database.collection('users').findOne({ _id: userId })
    } catch (error) {
        console.log(error)
    }

    user['password_status'] = 'OK'

    return res.render('account', { account: user })
})



// Actualizare nume
app.post('/update-name', async (req, res) => {
    try {
        var user = await database.collection('users').findOne({ _id: userId })
        var newUser = user;
        newUser['name'] = req.body['update-name']
        try {
            await database.collection('users').updateOne({ _id: userId }, { $set: newUser })
        } catch (error) {
            console.log(error)
        }
    } catch (error) {
        console.log(error)
    }
    user['password_status'] = 'OK'
    return res.render('account', { account: newUser })
})



// Actualizare email
app.post('/update-email', async (req, res) => {
    try {
        var user = await database.collection('users').findOne({ _id: userId })
        var newUser = user;
        newUser['email'] = req.body['update-email']
        try {
            await database.collection('users').updateOne({ _id: userId }, { $set: newUser })
        } catch (error) {
            console.log(error)
        }
    } catch (error) {
        console.log(error)
    }
    user['password_status'] = 'OK'
    return res.render('account', { account: newUser })
})



// Actualizare telefon
app.post('/update-phone', async (req, res) => {
    try {
        var user = await database.collection('users').findOne({ _id: userId })
        var newUser = user;
        newUser['phone'] = req.body['update-phone']
        try {
            await database.collection('users').updateOne({ _id: userId }, { $set: newUser })
        } catch (error) {
            console.log(error)
        }
    } catch (error) {
        console.log(error)
    }
    user['password_status'] = 'OK'
    return res.render('account', { account: newUser })
})



// Actualizare adresa
app.post('/update-address', async (req, res) => {
    try {
        var user = await database.collection('users').findOne({ _id: userId })
        var newUser = user;
        newUser['address'] = req.body['update-address']
        try {
            await database.collection('users').updateOne({ _id: userId }, { $set: newUser })
        } catch (error) {
            console.log(error)
        }
    } catch (error) {
        console.log(error)
    }
    user['password_status'] = 'OK'
    return res.render('account', { account: newUser })
})



// Actualizare portofel digital
app.post('/update-wallet', async (req, res) => {
    try {
        var user = await database.collection('users').findOne({ _id: userId })
        var newUser = user;
        newUser['wallet_address'] = req.body['update-wallet']
        try {
            await database.collection('users').updateOne({ _id: userId }, { $set: newUser })
        } catch (error) {
            console.log(error)
        }
    } catch (error) {
        console.log(error)
    }
    user['password_status'] = 'OK'
    return res.render('account', { account: newUser })
})



// Actualizare parola
app.post('/update-password', async (req, res) => {
    try {
        var user = await database.collection('users').findOne({ _id: userId })
        var newUser = user;
        if (req.body['update-old-password'] == user['password'] && req.body['update-new-password'] == req.body['update-confirm-password']) {
            newUser['password'] = req.body['update-new-password']
            try {
                await database.collection('users').updateOne({ _id: userId }, { $set: newUser })
            } catch (error) {
                console.log(error)
            }
            user['password_status'] = 'Parola schimbata cu succes'
        } else {
            user['password_status'] = 'Parolele nu se potrivesc'
        }
    } catch (error) {
        console.log(error)
    }

    return res.render('account', { account: newUser })
})



// Creare tranzactie
app.post('/create-transaction', async (req, res) => {
    var asset_description = req.body['transaction-asset']
    var asset_price = req.body['transaction-price']
    var asset_quantity = req.body['transaction-quantity']

    var data = {
        "seller_id": userId,
        "price": parseFloat(asset_price),
        "quantity": parseFloat(asset_quantity),
        "asset_description": asset_description,
        "delivery_date": "",
        "closed": 0,
        "buyer_id": "",
        "transaction_hash": ""
    }

    await database.collection('transactions').insertOne(data, (err, collection) => {
        if (err)
            throw err
        console.log("Record inserted successfully")
    })
    return res.redirect('/transactions')
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

    // Preluare tranzactii deschise
    try {
        var open_transactions = await database.collection('transactions').find({ seller_id: userId, closed: 0 }).toArray()
    } catch (error) {
        console.log(error)
    }

    if (!open_transactions.length) {
        open_transactions[0] = {
            'asset_description': 'Nu exista tranzactii deschise',
            // 'id': ''
        }
    } /* else {
        for (var i = 0; i < open_transactions.length; i++) {
            open_transactions[i]['id'] = open_transactions[i]['_id'].toString()
        }
    } */

    console.log(open_transactions)

    // Trimitere la frontend a tranzactiilor de vanzare si cumparare
    if (transactions.length && buying_transactions.length) {
        for (var i = 0; i < buying_transactions.length; i++) {
            transactions[transactions.length + 1] = buying_transactions[i]
        }
        return res.render('transactions', { transactions: transactions, open_transactions: open_transactions })
    } else if (transactions.length && !buying_transactions.length) {
        return res.render('transactions', { transactions: transactions, open_transactions: open_transactions })
    } else if (!transactions.length && buying_transactions.length) {
        return res.render('transactions', { transactions: buying_transactions, open_transactions: open_transactions })
    } else if (!transactions.length && !buying_transactions.length) {
        transactions[0] = {
            'type': 'Nu exista tranzactii incheiate'
        }
        return res.render('transactions', { transactions: transactions, open_transactions: open_transactions })
    }
})


// Stergere tranzactie deschisa
app.post('/delete-transaction', async (req, res) => {
    var transaction_id = req.body['transaction-delete-id']

    try {
        await database.collection('transactions').deleteOne({ _id: new mongoose.Types.ObjectId(transaction_id) })
    } catch (error) {
        console.log(error)
    }

    return res.redirect('/transactions')
})

app.post('/emit-transaction', async (req, res) => {

    var transaction_id = req.body['transaction-emit-id']
    var seller_username = req.body['transaction-emit-seller-username']
    try {
        var transaction = await database.collection('transactions').findOne({ _id: new mongoose.Types.ObjectId(transaction_id) })
    } catch (error) {
        console.log(error)
    }
    try {
        var seller = await database.collection('users').findOne({ username: seller_username })
    } catch (error) {
        console.log(error)
    }
    try {
        var buyer = await database.collection('users').findOne({ _id: new mongoose.Types.ObjectId(userId) })
    } catch (error) {
        console.log(error)
    }

    var seller_wallet = seller['wallet_address']
    var buyer_wallet = buyer['wallet_address']
    var buyer_pk = req.body['transaction-emit-buyer-pk']
    var price = transaction['price']
    var quantity = transaction['quantity']
    var asset_description = transaction['asset_description']

    //console.log(buyer)
    //console.log(transaction)
    //console.log(seller)
    //console.log(buyer_pk)
    console.log(buyer_wallet + '  ' + buyer_pk + '  ' + seller_wallet + '  ' + price + '  ' + quantity + '  ' + asset_description)

    const transactionScript = __dirname + '/scripts/transaction.py'
    console.log('\n' + transactionScript + '\n')
    const transactionArgs = [buyer_wallet, buyer_pk, seller_wallet, price, quantity, asset_description]

    const transactionProcess = spawn('/bin/python3.10', [transactionScript, ...transactionArgs])

    transactionProcess.stdout.on('data', (data) => {
        console.log(`\nPython script output:\n ${data}\n`)
    })

    transactionProcess.on('error', (error) => {
        console.error(`Error executing Python script: ${error}`)
    })

    transactionProcess.on('close', async (code) => {
        console.log(`\nPython script process exited with code ${code}\n`)
        if (code === 0) {
            try {
                await database.collection('transactions').deleteOne({ _id: new mongoose.Types.ObjectId(transaction_id) })
            } catch (error) {
                console.log(error)
            }
        
        }
        
        return res.redirect('/home')
        
    })

    /* 
    try {
        await database.collection('transactions').deleteOne({ _id: new mongoose.Types.ObjectId(transaction_id) })
    } catch (error) {
        console.log(error)
    }

    return res.redirect('/home') */


}) 