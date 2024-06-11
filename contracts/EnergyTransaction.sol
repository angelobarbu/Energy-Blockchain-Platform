// SPDX-License-Identifier: UNLICENSED
// © Barbu Angelo-Gabriel - angelo.barbu123@gmail.com - 2024
pragma solidity ^0.8.0;

contract EnergyTrading {
    // Define the various states a transaction can be in
    enum State {
        Listed,        // Initial state when the transaction is created
        Bidding,       // State when offers/bids are being made
        OfferMade,     // State when an offer is made
        Accepted,      // State when an offer is accepted
        Dispatched,    // State when the resource is dispatched
        InTransit,     // State when the resource is in transit
        Delivered,     // State when the resource is delivered
        PickedUp,      // State when the buyer picks up the resource
        Completed,     // State when the transaction is successfully completed
        Unlisted,      // State when the transaction is unlisted
        Expired        // State when the transaction deadline passes without any offers
    }

    // Structure to represent an offer made by a buyer or seller
    struct Offer {
        address offeror; // Address of the buyer/seller making the offer
        uint256 price;   // Offered price
        uint256 quantity;// Offered quantity
        uint256 timestamp; // Time when the offer was made
    }

    // Structure to represent a transaction
    struct Transaction {
        address buyer;             // Address of the buyer
        address payable seller;    // Address of the seller
        uint256 price;             // Price of the resource
        uint256 quantity;          // Quantity of the resource
        string resource;           // Name of the resource
        uint256 date;              // Timestamp when the transaction was created
        uint256 completionDate;    // Timestamp when the transaction was completed
        State state;               // Current state of the transaction
        uint256[] tracePoints;     // Array to store trace points in the delivery process
        Offer[] offers;            // Array to store offers made by buyers/sellers
        uint256 deadline;          // Deadline for the transaction to receive offers
        bool autoAcceptBestOffer;  // Option to automatically accept the best offer/bid when the deadline is reached
        bool isBuyTransaction;     // Indicates if the transaction is a buy transaction (true) or sell transaction (false)
    }

    // Array to store all transactions
    Transaction[] public transactions;
    // Mapping to access transactions by their ID
    mapping(uint256 => Transaction) public transactionById;
    // Mapping to store transactions by buyer's address
    mapping(address => uint256[]) public transactionsByBuyer;
    // Mapping to store transactions by seller's address
    mapping(address => uint256[]) public transactionsBySeller;

    // Event emitted when a new transaction is created
    event NewTransaction(
        uint256 transactionId,
        address indexed buyer,
        address indexed seller,
        uint256 price,
        uint256 quantity,
        string resource,
        uint256 date,
        bool isBuyTransaction
    );

    // Event emitted when the state of a transaction changes
    event StateChanged(uint256 transactionId, State state);

    // Event emitted when a new offer is made
    event NewOffer(uint256 transactionId, address indexed offeror, uint256 price, uint256 quantity);

    // Event emitted when an offer is accepted
    event OfferAccepted(uint256 transactionId, address indexed offeror);

    // Event emitted when the resource is picked up
    event ResourcePickedUp(uint256 transactionId);


    // Function to create a new buy transaction
    function createBuyTransaction(
        uint256 _price,
        uint256 _quantity,
        string memory _resource,
        uint256 _deadline,
        bool _autoAcceptBestOffer
    ) public returns (uint256) {
        uint256 transactionId = transactions.length;
        // Create a new transaction and add it to the transactions array
        transactions.push();
        Transaction storage newTransaction = transactions[transactionId];
        newTransaction.buyer = msg.sender;
        newTransaction.seller = payable(address(0)); // Initially no seller
        newTransaction.price = _price;
        newTransaction.quantity = _quantity;
        newTransaction.resource = _resource;
        newTransaction.date = block.timestamp;
        newTransaction.completionDate = 0;
        newTransaction.state = State.Listed;
        newTransaction.deadline = _deadline;
        newTransaction.autoAcceptBestOffer = _autoAcceptBestOffer;
        newTransaction.isBuyTransaction = true;

        // Update the mappings with the new transaction
        transactionById[transactionId] = newTransaction;
        transactionsByBuyer[msg.sender].push(transactionId);

        // Emit the NewTransaction event
        emit NewTransaction(transactionId, msg.sender, address(0), _price, _quantity, _resource, block.timestamp, true);
        return transactionId;
    }


    // Function to create a new sell transaction
    function createSellTransaction(
        uint256 _price,
        uint256 _quantity,
        string memory _resource,
        uint256 _deadline,
        bool _autoAcceptBestOffer
    ) public returns (uint256) {
        uint256 transactionId = transactions.length;
        // Create a new transaction and add it to the transactions array
        transactions.push();
        Transaction storage newTransaction = transactions[transactionId];
        newTransaction.buyer = address(0); // Initially no buyer
        newTransaction.seller = payable(msg.sender);
        newTransaction.price = _price;
        newTransaction.quantity = _quantity;
        newTransaction.resource = _resource;
        newTransaction.date = block.timestamp;
        newTransaction.completionDate = 0;
        newTransaction.state = State.Listed;
        newTransaction.deadline = _deadline;
        newTransaction.autoAcceptBestOffer = _autoAcceptBestOffer;
        newTransaction.isBuyTransaction = false;

        // Update the mappings with the new transaction
        transactionById[transactionId] = newTransaction;
        transactionsBySeller[msg.sender].push(transactionId);

        // Emit the NewTransaction event
        emit NewTransaction(transactionId, address(0), msg.sender, _price, _quantity, _resource, block.timestamp, false);
        return transactionId;
    }


    // Function to add an offer to a transaction
    function addOffer(uint256 _transactionId, uint256 _price, uint256 _quantity) public {
        Transaction storage transaction = transactions[_transactionId];
        // Ensure the transaction is still open for offers
        require(transaction.state == State.Listed || transaction.state == State.Bidding, "Transaction not open for offers");
        // Ensure the transaction deadline has not passed
        require(block.timestamp <= transaction.deadline, "Transaction deadline passed");

        // Add the new offer to the transaction
        transaction.offers.push(Offer({
            offeror: msg.sender,
            price: _price,
            quantity: _quantity,
            timestamp: block.timestamp
        }));

        // Update the transaction state to Bidding if it was Listed
        if (transaction.state == State.Listed) {
            transaction.state = State.Bidding;
        }

        // Sync `transactionById` with the updated transaction
        transactionById[_transactionId] = transaction;

        // Emit the NewOffer event
        emit NewOffer(_transactionId, msg.sender, _price, _quantity);
    }


    // Function to accept an offer
    function acceptOffer(uint256 _transactionId, uint256 _offerIndex) public payable {
        Transaction storage transaction = transactions[_transactionId];
        // Ensure the transaction is in the Bidding state
        require(transaction.state == State.Bidding, "No active offers to accept");

        // Get the accepted offer
        Offer memory acceptedOffer = transaction.offers[_offerIndex];

        if (transaction.isBuyTransaction) {
            // Ensure the caller is the buyer
            require(msg.sender == transaction.buyer, "Only the buyer can accept offers");
            // Ensure the correct amount of ETH is sent
            require(msg.value == acceptedOffer.price, "Incorrect ETH sent for offer");
            // Transfer the funds to the contract
            transaction.seller = payable(acceptedOffer.offeror);
        } else {
            // Ensure the caller is the seller
            require(msg.sender == transaction.seller, "Only the seller can accept offers");
            transaction.buyer = acceptedOffer.offeror;
        }

        // Update the transaction with the accepted offer details
        transaction.price = acceptedOffer.price;
        transaction.quantity = acceptedOffer.quantity;
        transaction.state = State.Accepted;

        // Sync `transactionById` with the updated transaction
        transactionById[_transactionId] = transaction;

        // Emit the OfferAccepted and StateChanged events
        emit OfferAccepted(_transactionId, acceptedOffer.offeror);
        emit StateChanged(_transactionId, State.Accepted);
    }


    // Function to update the state of a transaction
    function updateState(uint256 _transactionId, State _state) public {
        Transaction storage transaction = transactions[_transactionId];
        // Ensure the transaction is not already completed
        require(transaction.state != State.Completed, "Transaction already completed");

        if (_state == State.PickedUp) {
            // Ensure the transaction state is Delivered
            require(transaction.state == State.Delivered, "Can only pick up delivered resources");
            // Ensure the contract has enough balance to transfer to the seller
            require(address(this).balance >= transaction.price, "Insufficient funds in contract");
            // Transfer the funds to the seller
            payable(transaction.seller).transfer(transaction.price);
            // Emit the ResourcePickedUp event
            emit ResourcePickedUp(_transactionId);
        }

        // Update the transaction state
        transaction.state = _state;

        // Record the completion date if the transaction is completed
        if (_state == State.Completed) {
            transaction.completionDate = block.timestamp;
        }

        // Sync `transactionById` with the updated transaction
        transactionById[_transactionId] = transaction;

        // Emit the StateChanged event
        emit StateChanged(_transactionId, _state);
    }


    // Function to add a trace point to a transaction
    function addTracePoint(uint256 _transactionId, uint256 _tracePoint) public {
        Transaction storage transaction = transactions[_transactionId];
        // Ensure the transaction is in transit
        require(transaction.state == State.InTransit, "Transaction not in transit");

        // Add the trace point to the transaction
        transaction.tracePoints.push(_tracePoint);

        // Sync `transactionById` with the updated transaction
        transactionById[_transactionId] = transaction;
    }


    // Function to get the details of a transaction by its ID
    function getTransaction(uint256 _transactionId) public view returns (Transaction memory) {
        return transactionById[_transactionId];
    }

    // Function to get all transactions for a specific buyer
    function getTransactionsByBuyer(address _buyer) public view returns (uint256[] memory) {
        return transactionsByBuyer[_buyer];
    }

    // Function to get all transactions for a specific seller
    function getTransactionsBySeller(address _seller) public view returns (uint256[] memory) {
        return transactionsBySeller[_seller];
    }


    // Function to expire a transaction if the deadline has passed
    function expireTransaction(uint256 _transactionId) public payable {
        Transaction storage transaction = transactions[_transactionId];
        // Ensure the transaction is eligible for expiration
        require(transaction.state == State.Listed || transaction.state == State.Bidding, "Transaction not eligible for expiration");
        // Ensure the transaction deadline has passed
        require(block.timestamp > transaction.deadline, "Transaction deadline not passed yet");

        if (transaction.autoAcceptBestOffer) {
            uint256 bestOfferIndex = findBestOffer(_transactionId);
            if (bestOfferIndex != type(uint256).max) {
                acceptOffer(_transactionId, bestOfferIndex);
                return;
            }
        }

        // Update the transaction state to Expired
        transaction.state = State.Expired;

        // Sync `transactionById` with the updated transaction
        transactionById[_transactionId] = transaction;

        emit StateChanged(_transactionId, State.Expired);
    }


    // Function to unlist a transaction
    function unlistTransaction(uint256 _transactionId) public {
        Transaction storage transaction = transactions[_transactionId];
        // Ensure the transaction is eligible for unlisting
        require(transaction.state == State.Listed || transaction.state == State.Bidding, "Transaction not eligible for unlisting");

        // Update the transaction state to Unlisted
        transaction.state = State.Unlisted;

        // Sync `transactionById` with the updated transaction
        transactionById[_transactionId] = transaction;

        emit StateChanged(_transactionId, State.Unlisted);
    }


    // Function to find the best offer for a transaction based on the price
    function findBestOffer(uint256 _transactionId) internal view returns (uint256) {
        Transaction storage transaction = transactions[_transactionId];
        uint256 bestOfferIndex = type(uint256).max;
        uint256 bestPrice = 0;

        for (uint256 i = 0; i < transaction.offers.length; i++) {
            if (transaction.isBuyTransaction) {
                // For buy transactions, the best offer is the lowest price
                if (transaction.offers[i].price < bestPrice || bestPrice == 0) {
                    bestPrice = transaction.offers[i].price;
                    bestOfferIndex = i;
                }
            } else {
                // For sell transactions, the best offer is the highest price
                if (transaction.offers[i].price > bestPrice) {
                    bestPrice = transaction.offers[i].price;
                    bestOfferIndex = i;
                }
            }
        }
        return bestOfferIndex;
    }
}
