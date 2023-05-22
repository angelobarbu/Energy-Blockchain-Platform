# Sistem blockchain pentru trasabilitatea și certificarea resurselor energetice
Retea locala Blockchain rulata cu ajutorul Ganache si suita Truffle pentru o platforma de tranzactionare, monitorizare si certificare a resurselor energetice. La nivel de backend, se utilizeaza libraria Web3.py pentru efectuarea tranzactiei si emiterea contractului Smart scris in limbajul de programare Solidity.
Pentru frontend, au fost utilizate HTML, CSS si JavaScript(Node.js, Express), iar conectarea la baza de date a fost efectuata prin libraria de JS mongoose.

Dependinte:
- Script-ul de generare transactie "transactions.py" trebuie rulat folosind Python 3.10
- Python: Web3.py, solcx, Pymongo
- JavaScript: express, ejs, mongoose, body-parser, nodemon

Pentru rulare, se instaleaza dependintele si se executa una din comenzile:
- npm run serve server.js -> rulare prin node
- npm run dev server.js -> rulare prin nodemon pentru modificari asupra codului in timp real

Serverul ruleaza pe localhost, port 3000.

Blockchain-ul local este initializat cu ajutorul Ganache din suita Truffle, iar AppImage-ul poate fi descarcat de aici: https://github.com/trufflesuite/ganache-ui/releases/download/v2.7.1/ganache-2.7.1-linux-x86_64.AppImage
Reteaua locala blockchain trebuie rulata pe localhost, port 7545.

# Blockchain system for energy resources' tracking and certification
Local Blockchain network that runs using Ganache and Truffle suite for energy resources' trade, tracking and certification.
Backend wise, Web3.py is used to trigger the transaction and deploy the smart contract written using Solidity programming language.
Frontend wise, HTML, CSS and JavaScript(Node.js, Express) were used and they were connected using mongoose JS library.

Dependencies:
- The transaction generation script "transactions.py" must be run using Python 3.10
- Python: Web3.py, solcx, Pymongo
- JavaScript: express, ejs, mongoose, body-parser, nodemon

To run the server, dependencies must be installed and one of the following commands must be executed:
- npm run serve server.js -> run using node
- npm run dev server.js -> run using nodemon for real-time code modifications

The server runs on localhost, port 3000.

The local blockchain network is initialised using Ganache and Truffle suite and the AppImage can be downloaded from here: https://github.com/trufflesuite/ganache-ui/releases/download/v2.7.1/ganache-2.7.1-linux-x86_64.AppImage
The local blockchain network must run on localhost, port 7545.
