// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EnergyTrading {
    enum State {
        Listed,
        Bidding,
        OfferMade,
        Accepted,
        Dispatched,
        InTransit,
        Delivered,
        PickedUp,
        Completed,
        Unlisted,
        Expired
    }

    struct Offer {
        address offeror;
        uint256 price;
        uint256 quantity;
        uint256 timestamp;
    }

    struct Transaction {
        address buyer;
        address seller;
        uint256 price;
        uint256 quantity;
        string resource;
        uint256 date;
        uint256 completionDate;
        State state;
        uint256[] tracePoints;
        Offer[] offers;
        uint256 deadline;
        bool autoAcceptBestOffer;
        bool isBuyTransaction;
    }

    address public bufferWallet;

    constructor(address _bufferWallet) {
        bufferWallet = _bufferWallet;
    }

    Transaction[] public transactions;
    mapping(uint256 => Transaction) public transactionById;
    mapping(address => uint256[]) public transactionsByBuyer;
    mapping(address => uint256[]) public transactionsBySeller;

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

    event StateChanged(uint256 transactionId, State state);
    event NewOffer(uint256 transactionId, address indexed offeror, uint256 price, uint256 quantity);
    event OfferAccepted(uint256 transactionId, address indexed offeror);
    event ResourcePickedUp(uint256 transactionId);

    function createBuyTransaction(
        uint256 _price,
        uint256 _quantity,
        string memory _resource,
        uint256 _deadline,
        bool _autoAcceptBestOffer
    ) public returns (uint256) {
        uint256 transactionId = transactions.length;
        transactions.push();
        Transaction storage newTransaction = transactions[transactionId];
        newTransaction.buyer = msg.sender;
        newTransaction.seller = address(0);
        newTransaction.price = _price;
        newTransaction.quantity = _quantity;
        newTransaction.resource = _resource;
        newTransaction.date = block.timestamp;
        newTransaction.completionDate = 0;
        newTransaction.state = State.Listed;
        newTransaction.deadline = _deadline;
        newTransaction.autoAcceptBestOffer = _autoAcceptBestOffer;
        newTransaction.isBuyTransaction = true;

        transactionById[transactionId] = newTransaction;
        transactionsByBuyer[msg.sender].push(transactionId);

        emit NewTransaction(transactionId, msg.sender, address(0), _price, _quantity, _resource, block.timestamp, true);
        return transactionId;
    }

    function createSellTransaction(
        uint256 _price,
        uint256 _quantity,
        string memory _resource,
        uint256 _deadline,
        bool _autoAcceptBestOffer
    ) public returns (uint256) {
        uint256 transactionId = transactions.length;
        transactions.push();
        Transaction storage newTransaction = transactions[transactionId];
        newTransaction.buyer = address(0);
        newTransaction.seller = msg.sender;
        newTransaction.price = _price;
        newTransaction.quantity = _quantity;
        newTransaction.resource = _resource;
        newTransaction.date = block.timestamp;
        newTransaction.completionDate = 0;
        newTransaction.state = State.Listed;
        newTransaction.deadline = _deadline;
        newTransaction.autoAcceptBestOffer = _autoAcceptBestOffer;
        newTransaction.isBuyTransaction = false;

        transactionById[transactionId] = newTransaction;
        transactionsBySeller[msg.sender].push(transactionId);

        emit NewTransaction(transactionId, address(0), msg.sender, _price, _quantity, _resource, block.timestamp, false);
        return transactionId;
    }

    function addOffer(uint256 _transactionId, uint256 _price, uint256 _quantity) public {
        Transaction storage transaction = transactions[_transactionId];
        require(transaction.state == State.Listed || transaction.state == State.Bidding, "Transaction not open for offers");
        require(block.timestamp <= transaction.deadline, "Transaction deadline passed");

        transaction.offers.push(Offer({
            offeror: msg.sender,
            price: _price,
            quantity: _quantity,
            timestamp: block.timestamp
        }));

        if (transaction.state == State.Listed) {
            transaction.state = State.Bidding;
        }

        transactionById[_transactionId] = transaction;
        emit NewOffer(_transactionId, msg.sender, _price, _quantity);
    }

    function acceptOffer(uint256 _transactionId, uint256 _offerIndex) public payable {
        Transaction storage transaction = transactions[_transactionId];
        require(transaction.state == State.Bidding, "No active offers to accept");

        if (transaction.isBuyTransaction) {
            require(msg.sender == transaction.buyer, "Only the buyer can accept offers");
        } else {
            require(msg.sender == transaction.seller, "Only the seller can accept offers");
        }

        Offer memory acceptedOffer = transaction.offers[_offerIndex];

        if (transaction.isBuyTransaction) {
            require(msg.value == acceptedOffer.price, "Incorrect ETH sent for offer");
            payable(bufferWallet).transfer(msg.value);
            transaction.seller = acceptedOffer.offeror;
        } else {
            require(acceptedOffer.price == transaction.price, "Offer price does not match transaction price");
            payable(bufferWallet).transfer(acceptedOffer.price);
            transaction.buyer = acceptedOffer.offeror;
        }

        transaction.price = acceptedOffer.price;
        transaction.quantity = acceptedOffer.quantity;
        transaction.state = State.Accepted;

        transactionById[_transactionId] = transaction;
        emit OfferAccepted(_transactionId, acceptedOffer.offeror);
        emit StateChanged(_transactionId, State.Accepted);
    }

    function updateState(uint256 _transactionId, State _state) public {
        Transaction storage transaction = transactions[_transactionId];
        require(transaction.state != State.Completed, "Transaction already completed");

        if (_state == State.PickedUp) {
            require(transaction.state == State.Delivered, "Can only pick up delivered resources");
            payable(transaction.seller).transfer(transaction.price);
            emit ResourcePickedUp(_transactionId);
        }

        transaction.state = _state;

        if (_state == State.Completed) {
            transaction.completionDate = block.timestamp;
        }

        transactionById[_transactionId] = transaction;
        emit StateChanged(_transactionId, _state);
    }

    function addTracePoint(uint256 _transactionId, uint256 _tracePoint) public {
        Transaction storage transaction = transactions[_transactionId];
        require(transaction.state == State.InTransit, "Transaction not in transit");

        transaction.tracePoints.push(_tracePoint);
        transactionById[_transactionId] = transaction;
    }

    function getTransaction(uint256 _transactionId) public view returns (Transaction memory) {
        return transactionById[_transactionId];
    }

    function getTransactionsByBuyer(address _buyer) public view returns (uint256[] memory) {
        return transactionsByBuyer[_buyer];
    }

    function getTransactionsBySeller(address _seller) public view returns (uint256[] memory) {
        return transactionsBySeller[_seller];
    }

    function expireTransaction(uint256 _transactionId) public {
        Transaction storage transaction = transactions[_transactionId];
        require(transaction.state == State.Listed || transaction.state == State.Bidding, "Transaction not eligible for expiration");
        require(block.timestamp > transaction.deadline, "Transaction deadline not passed yet");

        if (transaction.autoAcceptBestOffer) {
            uint256 bestOfferIndex = findBestOffer(_transactionId);
            if (bestOfferIndex != type(uint256).max) {
                acceptOffer(_transactionId, bestOfferIndex);
                return;
            }
        }

        transaction.state = State.Expired;
        transactionById[_transactionId] = transaction;
        emit StateChanged(_transactionId, State.Expired);
    }

    function unlistTransaction(uint256 _transactionId) public {
        Transaction storage transaction = transactions[_transactionId];
        require(transaction.state == State.Listed || transaction.state == State.Bidding, "Transaction not eligible for unlisting");

        transaction.state = State.Unlisted;
        transactionById[_transactionId] = transaction;
        emit StateChanged(_transactionId, State.Unlisted);
    }

    function findBestOffer(uint256 _transactionId) internal view returns (uint256) {
        Transaction storage transaction = transactions[_transactionId];
        uint256 bestOfferIndex = type(uint256).max;
        uint256 bestPrice = 0;

        for (uint256 i = 0; i < transaction.offers.length; i++) {
            if (transaction.isBuyTransaction) {
                if (transaction.offers[i].price < bestPrice || bestPrice == 0) {
                    bestPrice = transaction.offers[i].price;
                    bestOfferIndex = i;
                }
            } else {
                if (transaction.offers[i].price > bestPrice) {
                    bestPrice = transaction.offers[i].price;
                    bestOfferIndex = i;
                }
            }
        }
        return bestOfferIndex;
    }
}
