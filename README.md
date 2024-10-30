# Bachelor's Diploma Project: Blockchain System for Energy Resources Tracking and Certification
### © Barbu Angelo-Gabriel - angelo.barbu123@gmail.com
### University Politehnica of Bucharest, Faculty of Automatic Control and Computer Science, Automatic Control and Systems Engineering
### 2022 - 2023

## Project Overview
### [RO] Sistem blockchain pentru trasabilitatea și certificarea resurselor energetice
Rețea locală Blockchain rulată cu ajutorul Ganache și suitei Truffle pentru o platformă de tranzacționare, monitorizare și certificare a resurselor energetice. La nivel de backend, se utilizează biblioteca **Web3.py** pentru efectuarea tranzacției și emiterea contractului smart scris în limbajul de programare Solidity. Pentru frontend, au fost utilizate **HTML**, **CSS** și **JavaScript** (Node.js, Express), iar conectarea la baza de date a fost realizată prin biblioteca JS **mongoose**.

### [EN]
A local blockchain network developed using **Ganache** and **Truffle Suite** to facilitate the trading, monitoring, and certification of energy resources. This system leverages **Web3.py** for transaction management and **Solidity** for smart contract implementation, with a web interface built using **HTML**, **CSS**, and **JavaScript** (Node.js, Express).

---

### Features
- **Blockchain Network**: Deployed locally via Ganache for safe testing and development.
- **Smart Contracts**: Created in Solidity for secure and transparent energy resource transactions.
- **Web3 Integration**: Uses Web3.py for transaction management and contract deployment.
- **Web Interface**: Built with HTML, CSS, and JavaScript for user interaction and real-time data updates.

---

## Getting Started

### Prerequisites
Ensure the following are installed before proceeding:
- **Python 3.10**
- **Ganache** and **Truffle Suite** (for blockchain network setup)
- **Node.js** and **npm**

### Dependencies
To install project dependencies, please follow the instructions for each language environment:

#### Python Dependencies
- Web3.py
- solcx
- Pymongo

#### JavaScript Dependencies
- express
- ejs
- mongoose
- body-parser
- nodemon

### Installation and Setup
1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Run the server using one of the following commands
    - Node.js:
        ```bash
            npm run serve
        ```
    - Nodemon: 
        ```bash
            npm run dev
        ```

4. Start Ganache to initialize the local blockchain:
    - Download the AppImage for Ganache [here](https://archive.trufflesuite.com/ganache/).
    - Run Ganache on ```localhost```, port ```3000```.

### Usage
- **Server**: Runs on ```localhost```, port ```3000```.
- **Blockchain Network**: Operates on ```localhost```, port ```7545```.

## Additional Information
This project was developed as part of the *Bachelor's Diploma Project [Lucrare de Licență]* in *Automatic Control and Systems Engineering [Automatică și Ingineria Sistemelor]* for **Universitatea Politehnica Bucuresti, Facultatea de Automatica si Calculatoare**. 
