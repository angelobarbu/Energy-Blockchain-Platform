// © Barbu Angelo-Gabriel - angelo.barbu123@gmail.com - 2024

const { time, BN } = require('@openzeppelin/test-helpers');
const EnergyTrading = artifacts.require("EnergyTrading");

contract("EnergyTrading", (accounts) => {
  const buyer = accounts[0];
  const seller = accounts[1];
  const otherBuyer = accounts[2];
  const anotherBuyer = accounts[3];
  const anotherSeller = accounts[4];
  const resource = "Electricity";
  const quantity = 100;
  const price = web3.utils.toWei("1", "ether");
  const oneHour = 3600; // 1 hour in seconds

  beforeEach(async () => {
    this.energyTrading = await EnergyTrading.new({ from: buyer });
  });

  it("should create a buy transaction with no seller", async () => {
    console.log("Creating a buy transaction with no seller...");
    const futureDeadline = (await time.latest()).addn(oneHour); // 1 hour from now
    const tx = await this.energyTrading.createBuyTransaction(price, quantity, resource, futureDeadline, false, { from: buyer });

    const transactionId = tx.logs[0].args.transactionId.toNumber();
    const transaction = await this.energyTrading.getTransaction(transactionId);
    console.log("Transaction details:", transaction);
    assert.equal(transaction.buyer, buyer);
    assert.equal(transaction.seller, "0x0000000000000000000000000000000000000000");
    assert.equal(transaction.resource, resource);
    assert.equal(transaction.quantity, quantity);
    assert.equal(transaction.price, price);
    assert.equal(transaction.isBuyTransaction, true);
  });

  it("should create a sell transaction with no buyer", async () => {
    console.log("Creating a sell transaction with no buyer...");
    const futureDeadline = (await time.latest()).addn(oneHour); // 1 hour from now
    const tx = await this.energyTrading.createSellTransaction(price, quantity, resource, futureDeadline, false, { from: seller });

    const transactionId = tx.logs[0].args.transactionId.toNumber();
    const transaction = await this.energyTrading.getTransaction(transactionId);
    console.log("Transaction details:", transaction);
    assert.equal(transaction.buyer, "0x0000000000000000000000000000000000000000");
    assert.equal(transaction.seller, seller);
    assert.equal(transaction.resource, resource);
    assert.equal(transaction.quantity, quantity);
    assert.equal(transaction.price, price);
    assert.equal(transaction.isBuyTransaction, false);
  });

  it("should add multiple offers to a buy transaction and select the best one", async () => {
    console.log("Creating a buy transaction and adding multiple offers...");
    const futureDeadline = (await time.latest()).addn(oneHour); // 1 hour from now
    const tx = await this.energyTrading.createBuyTransaction(price, quantity, resource, futureDeadline, true, { from: buyer });

    const transactionId = tx.logs[0].args.transactionId.toNumber();
    await this.energyTrading.addOffer(transactionId, web3.utils.toWei("0.9", "ether"), quantity, { from: anotherSeller });
    await this.energyTrading.addOffer(transactionId, web3.utils.toWei("0.8", "ether"), quantity, { from: seller });

    // Move forward in time to pass the deadline
    await time.increaseTo(futureDeadline.addn(1));

    // Expire the transaction and auto-accept the best offer
    console.log("Expiring the transaction and auto-accepting the best offer...");
    await this.energyTrading.expireTransaction(transactionId, { from: buyer, value: web3.utils.toWei("0.8", "ether") });
    const transaction = await this.energyTrading.getTransaction(transactionId);
    console.log("Transaction details after expiring and auto-accepting:", transaction);

    assert.equal(transaction.state, 3); // State.Accepted
    assert.equal(transaction.seller, seller);
    assert.equal(transaction.price, web3.utils.toWei("0.8", "ether"));
  });

  it("should add multiple bids to a sell transaction and select the best one", async () => {
    console.log("Creating a sell transaction and adding multiple bids...");
    const futureDeadline = (await time.latest()).addn(oneHour); // 1 hour from now
    const tx = await this.energyTrading.createSellTransaction(price, quantity, resource, futureDeadline, true, { from: seller });

    const transactionId = tx.logs[0].args.transactionId.toNumber();
    await this.energyTrading.addOffer(transactionId, web3.utils.toWei("1.1", "ether"), quantity, { from: otherBuyer });
    await this.energyTrading.addOffer(transactionId, web3.utils.toWei("1.2", "ether"), quantity, { from: anotherBuyer });

    // Move forward in time to pass the deadline
    await time.increaseTo(futureDeadline.addn(1));

    // Expire the transaction and auto-accept the best bid
    console.log("Expiring the transaction and auto-accepting the best bid...");
    await this.energyTrading.expireTransaction(transactionId, { from: seller });
    const transaction = await this.energyTrading.getTransaction(transactionId);
    console.log("Transaction details after expiring and auto-accepting:", transaction);

    assert.equal(transaction.state, 3); // State.Accepted
    assert.equal(transaction.buyer, anotherBuyer);
    assert.equal(transaction.price, web3.utils.toWei("1.2", "ether"));
  });

  it("should accept an offer directly for a buy transaction", async () => {
    console.log("Creating a buy transaction and directly accepting an offer...");
    const futureDeadline = (await time.latest()).addn(oneHour); // 1 hour from now
    const tx = await this.energyTrading.createBuyTransaction(price, quantity, resource, futureDeadline, false, { from: buyer });

    const transactionId = tx.logs[0].args.transactionId.toNumber();
    await this.energyTrading.addOffer(transactionId, web3.utils.toWei("0.9", "ether"), quantity, { from: anotherSeller });
    await this.energyTrading.acceptOffer(transactionId, 0, { from: buyer, value: web3.utils.toWei("0.9", "ether") });
    const transaction = await this.energyTrading.getTransaction(transactionId);
    console.log("Transaction details after accepting offer:", transaction);

    assert.equal(transaction.seller, anotherSeller);
    assert.equal(transaction.price, web3.utils.toWei("0.9", "ether"));
    assert.equal(transaction.state, 3); // State.Accepted
  });

  it("should accept an offer directly for a sell transaction", async () => {
    console.log("Creating a sell transaction and directly accepting an offer...");
    const futureDeadline = (await time.latest()).addn(oneHour); // 1 hour from now
    const tx = await this.energyTrading.createSellTransaction(price, quantity, resource, futureDeadline, false, { from: seller });

    const transactionId = tx.logs[0].args.transactionId.toNumber();
    await this.energyTrading.addOffer(transactionId, web3.utils.toWei("1.1", "ether"), quantity, { from: otherBuyer });
    await this.energyTrading.acceptOffer(transactionId, 0, { from: seller });
    const transaction = await this.energyTrading.getTransaction(transactionId);
    console.log("Transaction details after accepting offer:", transaction);

    assert.equal(transaction.buyer, otherBuyer);
    assert.equal(transaction.price, web3.utils.toWei("1.1", "ether"));
    assert.equal(transaction.state, 3); // State.Accepted
  });

  it("should accept an offer and transfer funds to the contract", async () => {
    console.log("Creating a buy transaction, accepting an offer and transferring funds to the contract...");
    const futureDeadline = (await time.latest()).addn(oneHour); // 1 hour from now
    const tx = await this.energyTrading.createBuyTransaction(price, quantity, resource, futureDeadline, false, { from: buyer });

    const transactionId = tx.logs[0].args.transactionId.toNumber();
    await this.energyTrading.addOffer(transactionId, web3.utils.toWei("0.9", "ether"), quantity, { from: anotherSeller });

    // Buyer accepts the offer
    await this.energyTrading.acceptOffer(transactionId, 0, { from: buyer, value: web3.utils.toWei("0.9", "ether") });

    const transaction = await this.energyTrading.getTransaction(transactionId);
    console.log("Transaction details after accepting offer:", transaction);
    assert.equal(transaction.seller, anotherSeller);
    assert.equal(transaction.price, web3.utils.toWei("0.9", "ether"));
    assert.equal(transaction.state, 3); // State.Accepted
  });

  it("should transfer funds from contract to seller on pickup", async () => {
    console.log("Creating a buy transaction, accepting an offer, and verifying fund transfer to seller on pickup...");
    const futureDeadline = (await time.latest()).addn(oneHour); // 1 hour from now
    const tx = await this.energyTrading.createBuyTransaction(price, quantity, resource, futureDeadline, false, { from: buyer });

    const transactionId = tx.logs[0].args.transactionId.toNumber();
    await this.energyTrading.addOffer(transactionId, web3.utils.toWei("0.9", "ether"), quantity, { from: anotherSeller });

    // Buyer accepts the offer
    await this.energyTrading.acceptOffer(transactionId, 0, { from: buyer, value: web3.utils.toWei("0.9", "ether") });

    // Verify the state is Accepted
    let transaction = await this.energyTrading.getTransaction(transactionId);
    console.log(`Transaction state after accepting offer: ${transaction.state.toString()}`);

    // Update state to Delivered
    await this.energyTrading.updateState(transactionId, 6, { from: buyer }); // State.Delivered

    // Verify the state is Delivered
    transaction = await this.energyTrading.getTransaction(transactionId);
    console.log(`Transaction state after marking as delivered: ${transaction.state.toString()}`);

    // Capture initial seller balance
    const initialSellerBalance = new BN(await web3.eth.getBalance(anotherSeller));
    console.log(`Initial seller balance: ${initialSellerBalance.toString()}`);

    // Update state to PickedUp
    await this.energyTrading.updateState(transactionId, 7, { from: buyer }); // State.PickedUp

    // Verify the state is PickedUp
    transaction = await this.energyTrading.getTransaction(transactionId);
    console.log(`Transaction state after marking as picked up: ${transaction.state.toString()}`);

    // Check seller balance after pickup
    const finalSellerBalance = new BN(await web3.eth.getBalance(anotherSeller));
    console.log(`Final seller balance: ${finalSellerBalance.toString()}`);

    const expectedBalance = initialSellerBalance.add(new BN(web3.utils.toWei("0.9", "ether")));
    assert(expectedBalance.eq(finalSellerBalance), `Expected ${expectedBalance.toString()} but got ${finalSellerBalance.toString()}`);
  });

  it("should update the state of a transaction to Dispatched", async () => {
    console.log("Creating a buy transaction and updating its state to Dispatched...");
    const futureDeadline = (await time.latest()).addn(oneHour); // 1 hour from now
    const tx = await this.energyTrading.createBuyTransaction(price, quantity, resource, futureDeadline, false, { from: buyer });

    const transactionId = tx.logs[0].args.transactionId.toNumber();
    await this.energyTrading.updateState(transactionId, 4, { from: buyer }); // State.Dispatched
    const transaction = await this.energyTrading.getTransaction(transactionId);
    console.log("Transaction details after updating state to Dispatched:", transaction);

    assert.equal(transaction.state, 4); // State.Dispatched
  });

  it("should add a trace point", async () => {
    console.log("Creating a buy transaction and adding a trace point...");
    const futureDeadline = (await time.latest()).addn(oneHour); // 1 hour from now
    const tx = await this.energyTrading.createBuyTransaction(price, quantity, resource, futureDeadline, false, { from: buyer });

    const transactionId = tx.logs[0].args.transactionId.toNumber();
    await this.energyTrading.updateState(transactionId, 5, { from: buyer }); // State.InTransit
    await this.energyTrading.addTracePoint(transactionId, 12345, { from: buyer });
    const transaction = await this.energyTrading.getTransaction(transactionId);
    console.log("Transaction details after adding trace point:", transaction);

    assert.equal(transaction.tracePoints.length, 1);
    assert.equal(transaction.tracePoints[0], 12345);
  });

  it("should complete a transaction", async () => {
    console.log("Creating a buy transaction and completing it...");
    const futureDeadline = (await time.latest()).addn(oneHour); // 1 hour from now
    const tx = await this.energyTrading.createBuyTransaction(price, quantity, resource, futureDeadline, false, { from: buyer });

    const transactionId = tx.logs[0].args.transactionId.toNumber();
    await this.energyTrading.updateState(transactionId, 8, { from: buyer }); // State.Completed
    const transaction = await this.energyTrading.getTransaction(transactionId);
    console.log("Transaction details after completing it:", transaction);

    assert.equal(transaction.state, 8); // State.Completed
    assert.notEqual(transaction.completionDate, 0);
  });

  it("should expire a transaction", async () => {
    console.log("Creating a buy transaction and expiring it...");
    const pastDeadline = (await time.latest()).subn(oneHour); // 1 hour ago
    const tx = await this.energyTrading.createBuyTransaction(price, quantity, resource, pastDeadline, false, { from: buyer });

    const transactionId = tx.logs[0].args.transactionId.toNumber();
    await this.energyTrading.expireTransaction(transactionId, { from: buyer });
    const transaction = await this.energyTrading.getTransaction(transactionId);
    console.log("Transaction details after expiring it:", transaction);

    assert.equal(transaction.state, 10); // State.Expired
  });

  it("should unlist a transaction", async () => {
    console.log("Creating a buy transaction and unlisting it...");
    const futureDeadline = (await time.latest()).addn(oneHour); // 1 hour from now
    const tx = await this.energyTrading.createBuyTransaction(price, quantity, resource, futureDeadline, false, { from: buyer });

    const transactionId = tx.logs[0].args.transactionId.toNumber();
    await this.energyTrading.unlistTransaction(transactionId, { from: buyer });
    const transaction = await this.energyTrading.getTransaction(transactionId);
    console.log("Transaction details after unlisting it:", transaction);

    assert.equal(transaction.state, 9); // State.Unlisted
  });

  it("should auto accept the best offer when expired if option is set for buy transaction", async () => {
    console.log("Creating a buy transaction with auto-accept option and adding multiple offers...");
    const futureDeadline = (await time.latest()).addn(oneHour); // 1 hour from now
    const tx = await this.energyTrading.createBuyTransaction(price, quantity, resource, futureDeadline, true, { from: buyer });

    const transactionId = tx.logs[0].args.transactionId.toNumber();
    await this.energyTrading.addOffer(transactionId, web3.utils.toWei("0.9", "ether"), quantity, { from: anotherSeller });
    await this.energyTrading.addOffer(transactionId, web3.utils.toWei("0.8", "ether"), quantity, { from: seller });

    // Move forward in time to pass the deadline
    await time.increaseTo(futureDeadline.addn(1));

    // Expire the transaction and auto-accept the best offer
    console.log("Expiring the transaction and auto-accepting the best offer...");
    await this.energyTrading.expireTransaction(transactionId, { from: buyer, value: web3.utils.toWei("0.8", "ether") });
    const transaction = await this.energyTrading.getTransaction(transactionId);
    console.log("Transaction details after expiring and auto-accepting:", transaction);

    assert.equal(transaction.state, 3); // State.Accepted
    assert.equal(transaction.seller, seller);
    assert.equal(transaction.price, web3.utils.toWei("0.8", "ether"));
  });

  it("should auto accept the best bid when expired if option is set for sell transaction", async () => {
    console.log("Creating a sell transaction with auto-accept option and adding multiple bids...");
    const futureDeadline = (await time.latest()).addn(oneHour); // 1 hour from now
    const tx = await this.energyTrading.createSellTransaction(price, quantity, resource, futureDeadline, true, { from: seller });

    const transactionId = tx.logs[0].args.transactionId.toNumber();
    await this.energyTrading.addOffer(transactionId, web3.utils.toWei("1.1", "ether"), quantity, { from: otherBuyer });
    await this.energyTrading.addOffer(transactionId, web3.utils.toWei("1.2", "ether"), quantity, { from: anotherBuyer });

    // Move forward in time to pass the deadline
    await time.increaseTo(futureDeadline.addn(1));

    // Expire the transaction and auto-accept the best bid
    console.log("Expiring the transaction and auto-accepting the best bid...");
    await this.energyTrading.expireTransaction(transactionId, { from: seller });
    const transaction = await this.energyTrading.getTransaction(transactionId);
    console.log("Transaction details after expiring and auto-accepting:", transaction);

    assert.equal(transaction.state, 3); // State.Accepted
    assert.equal(transaction.buyer, anotherBuyer);
    assert.equal(transaction.price, web3.utils.toWei("1.2", "ether"));
  });
});
