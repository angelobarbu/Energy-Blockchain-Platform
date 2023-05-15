// SPDX-License-Identifier: UNLICENSED
// Barbu Angelo-Gabriel
// Universitatea Politehnica Bucuresti
// Facultatea de Automatica si Calculatoare
// Lucrare de licenta - iulie 2023
// Sistem blockchain pentru trasabilitatea și certificarea resurselor energetice

pragma solidity ^0.8.0;

contract EnergyContract {
    
    // Variabilele continute de contract
    address payable public buyer;
    address payable public seller;
    string public price;
    string public quantity;
    string public deliveryDate;
    string public assetDescription;
    
    // Constructorul pentru initializarea variabilelor contractului
    constructor(address payable _buyer, address payable _seller, string memory _price, string memory _quantity, string memory _deliveryDate, string memory _assetDescription) {
        buyer = _buyer;
        seller = _seller;
        price = _price;
        quantity = _quantity;
        deliveryDate = _deliveryDate;
        assetDescription = _assetDescription;
    }

}
