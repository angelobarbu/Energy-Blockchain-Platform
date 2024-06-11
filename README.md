# Decentralised Energy Trading and Tracking System
### © Barbu Angelo-Gabriel - angelo.barbu123@gmail.com - 2024

---

## Table of Contents

1. [Introduction](#introduction)
2. [Smart Contract](#smart-contract)
   - [Workflow](#workflow)
   - [Implementation Details](#implementation-details)
   - [Testing](#testing)
   - [Deployment](#deployment)
3. [Frontend Integration](#frontend-integration)
4. [Backend Integration](#backend-integration)

---

## Introduction

The Decentralised Energy Trading and Tracking System offers a highly secure and privacy-preserving system where energy resources can be traded, tracked and certified using a smart contract that facilitates the decentralized trading and tracking of energy resources between buyers and sellers. This contract supports creating buy and sell transactions, making offers, accepting offers, and ensuring secure fund transfers upon transaction completion.

## Smart Contract

### Workflow

1. **Create Transaction**: 
   - **Buy Transaction**: Created by a buyer with details like price, quantity, resource type, deadline, and auto-accept option.
   - **Sell Transaction**: Created by a seller with similar details.
   
2. **Add Offers**:
   - Participants can add offers to buy or sell transactions, specifying price and quantity.

3. **Accept Offers**:
   - The buyer or seller can accept an offer. For buy transactions, the buyer's funds are withheld within the contract.

4. **Update Transaction State**:
   - The state of a transaction can be updated through various stages such as Dispatched, InTransit, Delivered, PickedUp, and Completed.

5. **Expire Transactions**:
   - Transactions can be expired after the deadline. If the auto-accept option is set, the best offer is automatically accepted.

### Implementation Details

- **State Enum**: Represents the various states a transaction can be in.
- **Offer Struct**: Contains details of an offer including offeror, price, quantity, and timestamp.
- **Transaction Struct**: Contains details of a transaction including buyer, seller, price, quantity, resource, dates, state, trace points, offers, deadline, and auto-accept option.
- **Events**: Various events like `NewTransaction`, `StateChanged`, `NewOffer`, `OfferAccepted`, and `ResourcePickedUp` are emitted during the workflow.

### Testing

#### Prerequisites

- Node.js
- Truffle
- Ganache

#### Running Tests

1. Install dependencies:
```bash
npm install
 ```

2. Compile the smart contract:
```bash
truffle compile
```

3. Deploy the contract to a local test network:
```bash
truffle migrate
```

4. Run the tests:
```bash
truffle test
```

### Deployment

To deploy the smart contract to a live network:

1. Configure the `truffle-config.js` file with the desired network settings.

2. Deploy the contract:
```bash
truffle migrate --network <network-name>
```

## Frontend Integration

Work In Progress

## Backend Integration

Work In Progress