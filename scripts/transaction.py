# Barbu Angelo-Gabriel
# Universitatea Politehnica Bucuresti
# Facultatea de Automatica si Calculatoare
# Lucrare de licenta - iulie 2023
# Sistem blockchain pentru trasabilitatea și certificarea resurselor energetice

from web3 import Web3
from web3.gas_strategies.rpc import rpc_gas_price_strategy
from solcx import compile_source
from pathlib import Path
import os
from datetime import datetime

# Hardcodarea parametrilor pentru declansarea tranzactiei si emiterea contractului smart
buyer_wallet = '0x80AA3c5c7c41F622Fe48ccdf1E2884bDC3f485e8'
buyer_pk = '0xc71d1f08136c6c64d8e4169e9d9ba9ede8086be8a2509a68f93038c3ef8f84a5'
seller_wallet = '0xB9A02a5966e56F6a94E97f9ECFc79f5d9536d85b'
price = 1.5
quantity = 3
delivery_date = (datetime.now()).strftime("%Y/%m/%d_%H:%M:%S")
asset_description = 'LNG'

# Conectarea la reteaua blockchain locala
web3 = Web3(Web3.HTTPProvider('http://localhost:7545'))

# Setarea strategiei de calcul al pretului combustibilului de transfer
web3.eth.set_gas_price_strategy(rpc_gas_price_strategy)

# Compilarea si executia fisierului sursa ce contine implementarea contractul smart
os.chdir(os.path.dirname(os.path.abspath(__file__)))
contract_path = Path(os.path.abspath('contract.sol'))
contract_source = contract_path.read_text()
compiled_contract = compile_source(contract_source)['<stdin>:EnergyContract']
contract = web3.eth.contract(abi=compiled_contract['abi'], bytecode=compiled_contract['bin'])

# Initializarea tranzactiei folosind cheia privata a cumparatorului
tx_dict = web3.eth.account.sign_transaction(
    {
        "nonce": web3.eth.get_transaction_count(buyer_wallet),
        "gasPrice": web3.eth.generate_gas_price(),
        "gas": 21000,
        "to": seller_wallet,
        "value": web3.to_wei(price, "ether"),
    },
    buyer_pk,
)

# Declansarea tranzactiei
tx_hash = web3.eth.send_raw_transaction(tx_dict.rawTransaction)
tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
print(f"Tranzactie efectuata cu succes avand hash: { tx_receipt.transactionHash.hex() }")

# Popularea parametrilor contractului smart
contract_constructor = contract.constructor(
    buyer_wallet,
    seller_wallet,
    str(price),
    str(quantity),
    delivery_date,
    asset_description
).build_transaction({
    'from': web3.to_checksum_address(buyer_wallet),
    'nonce': web3.eth.get_transaction_count(buyer_wallet),
})

# Initializarea si emiterea contractului smart
contract_dict = web3.eth.account.sign_transaction(
    contract_constructor,
    buyer_pk,
)
contract_hash = web3.eth.send_raw_transaction(contract_dict.rawTransaction)
contract_receipt = web3.eth.wait_for_transaction_receipt(contract_hash)
contract_address = contract_receipt.contractAddress
print(f'Contract emis cu succes la adresa: { contract_address }')
