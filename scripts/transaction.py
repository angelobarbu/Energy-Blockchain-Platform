# Barbu Angelo-Gabriel
# Universitatea Politehnica Bucuresti
# Facultatea de Automatica si Calculatoare
# Lucrare de licenta - iulie 2023
# Sistem blockchain pentru trasabilitatea și certificarea resurselor energetice

from web3 import Web3
from web3.gas_strategies.rpc import rpc_gas_price_strategy
import solcx
from pathlib import Path
import os
from datetime import datetime
import pymongo
import sys

args = sys.argv[1:]

# Hardcodarea parametrilor pentru declansarea tranzactiei si emiterea contractului smart
# buyer_wallet = '0x66B294F65b4b0fCc4B90a9f3C0B70f510D122e94'
# buyer_pk = '0xceb23e34f474b633f3afd17a34e960ab7e154b2b11f346a01ce6be802c1e2d03'
# seller_wallet = '0x2d355e1C5fE5Cb0c47f4BfA46964f65Ee49545be'
# price = 0.82
# quantity = 45
# asset_description = 'GNL'

# Primirea argumentelor de la server
buyer_wallet = args[0]
buyer_pk = args[1]
seller_wallet = args[2]
price = float(args[3])
quantity = float(args[4])
asset_description = args[5]

delivery_date = (datetime.now()).strftime("%Y/%m/%d %H:%M:%S")

# Cumparator:'0x66B294F65b4b0fCc4B90a9f3C0B70f510D122e94''0xceb23e34f474b633f3afd17a34e960ab7e154b2b11f346a01ce6be802c1e2d03'
# Vanzator: '0x50A7cf135083f3F90566eeF565b345a95B326C54'
# Cont buffer: '0x2d355e1C5fE5Cb0c47f4BfA46964f65Ee49545be' '0x3dcc22c33509b3bb6734976c8ed4cd5e705466ca17f03c8862ae950e437776df'

# Conectarea la reteaua blockchain locala
web3 = Web3(Web3.HTTPProvider('http://localhost:7545'))

# Setarea compilatorului Solidity la versiunea folosita pentru contractul Smart
solcx.set_solc_version("0.8.0")

# Setarea strategiei de calcul al pretului combustibilului de transfer
web3.eth.set_gas_price_strategy(rpc_gas_price_strategy)

# Compilarea si executia fisierului sursa ce contine implementarea contractul smart
os.chdir(os.path.dirname(os.path.abspath(__file__)))
contract_path = Path(os.path.abspath('contract.sol'))
contract_source = contract_path.read_text()
compiled_contract = solcx.compile_source(contract_source)['<stdin>:EnergyContract']
contract = web3.eth.contract(abi=compiled_contract['abi'], bytecode=compiled_contract['bin'])

# Initializarea tranzactiei folosind cheia privata a cumparatorului
tx = web3.eth.account.sign_transaction(
    {
        "nonce": web3.eth.get_transaction_count(buyer_wallet),
        "gasPrice": web3.eth.generate_gas_price(),
        "gas": 21000,
        "to": seller_wallet,
        "value": web3.to_wei(price, 'ether'),
    },
    buyer_pk,
)

# Declansarea tranzactiei
tx_hash = web3.eth.send_raw_transaction(tx.rawTransaction)
tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
hash = tx_receipt.transactionHash.hex()
print(f"Tranzactie efectuata cu succes avand hash: { hash }")

# Popularea parametrilor contractului smart
contract_constructor = contract.constructor(
    buyer_wallet,
    seller_wallet,
    str(price),
    str(quantity),
    delivery_date,
    asset_description
).build_transaction({
    "from": web3.to_checksum_address(buyer_wallet),
    "nonce": web3.eth.get_transaction_count(buyer_wallet),
})

# Initializarea si emiterea contractului smart
contract_sign = web3.eth.account.sign_transaction(
    contract_constructor,
    buyer_pk,
)
contract_hash = web3.eth.send_raw_transaction(contract_sign.rawTransaction)
contract_receipt = web3.eth.wait_for_transaction_receipt(contract_hash)
contract_address = contract_receipt.contractAddress
print(f'Contract emis cu succes la adresa: { contract_address }')
print(f'Timestamp: {delivery_date}')

# Conectarea la clientul Mongo si preluarea id-urilor cumparatorului si vanzatorului
dbclient = pymongo.MongoClient('mongodb+srv://angelobarbu:5jnlegmqWryv6qtF@platformdb.dh4ypq7.mongodb.net/')
db = dbclient['transactions_platform']

users = db['users']
seller_id = users.find_one({'wallet_address': seller_wallet})['_id']
buyer_id = users.find_one({'wallet_address': buyer_wallet})['_id']

# Inserarea tranzactiei si a contractului smart in baza de date
transaction_dict = {
    "seller_id": seller_id,
    "price": price,
    "quantity": quantity,
    "asset_description": asset_description,
    "delivery_date": delivery_date,
    "closed": 1,
    "buyer_id": buyer_id,
    "transaction_hash": hash
}

contract_dict = {
    "buyer_id": buyer_id,
    "buyer_wallet": buyer_wallet,
    "seller_id": seller_id,
    "seller_wallet": seller_wallet,
    "price": price,
    "quantity": quantity,
    "asset_description": asset_description,
    "delivery_date": delivery_date,
    "contract_address": contract_address,
    "transaction_hash": hash
}

transactions = db['transactions']
contracts = db['contracts']
inserted_transaction = transactions.insert_one(transaction_dict)
print(f'Tranzactia a fost adaugata cu succes in baza de date, cu id-ul: {inserted_transaction.inserted_id}')
inserted_contract = contracts.insert_one(contract_dict)
print(f'Contractul Smart a fost adaugat cu succes in baza de date, cu id-ul: {inserted_contract.inserted_id}')


