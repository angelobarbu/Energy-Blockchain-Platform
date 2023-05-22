# Sistem blockchain pentru trasabilitatea și certificarea resurselor energetice
Retea locala Blockchain rulata cu ajutorul Ganache si suita Truffle pentru o platforma de tranzactionare, monitorizare si certificare a resurselor energetice. La nivel de backend, se utilizeaza libraria Web3.py pentru efectuarea tranzactiei si emiterea contractului Smart scris in limbajul de programare Solidity.
Pentru frontend, au fost utilizate HTML, CSS si JavaScript(Node.js), iar conectarea la baza de date a fost efectuata prin libraria de JS mongoose.

Dependinte:
- Python: Web3.py, solcx, Pymongo
- JavaScript: express, mongoose, body-parser, nodemon

Pentru rulare, se instaleaza dependintele si se executa una din comenzile:
- npm run serve server.js -> rulare prin node
- npm run dev server.js -> rulare prin nodemon pentru modificari asupra codului in timp real

Serverul ruleaza pe localhost, port 3000.

# Blockchain system for energy resources' tracking and certification
Local Blockchain network that runs using Ganache and Truffle suite for energy resources' trade, tracking and certification.
Backend wise, Web3.py is used to trigger the transaction and deploy the smart contract written using Solidity programming language.
Frontend wise, HTML, CSS and JavaScript(Node.js) were used and they were connected using mongoose JS library.

Dependencies:
- Python: Web3.py, solcx, Pymongo
- JavaScript: express, mongoose, body-parser, nodemon

To run the server, dependencies must be installed and one of the following commands must be executed:
- npm run serve server.js -> run using node
- npm run dev server.js -> run using nodemon for real-time code modifications

The server runs on localhost, port 3000.
