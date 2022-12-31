// Anytime you read and write to and from storage, you spend a lot of gas

const { ethers, deployments, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function() {
          let fundMe;
          let deployer;
          let mockV3Aggregator; // a contract
          // const sendValue = "1000000000000000000"; // 1eth
          const sendValue1 = ethers.utils.parseEther("1");

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer;
              await deployments.fixture(["all"]);
              fundMe = await ethers.getContract("FundMe", deployer);
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              );
          });

          describe("constructor", function() {
              it("sets the aggregator contract correctly", async () => {
                  const response = await fundMe.s_priceFeed();
                  assert.equal(response, mockV3Aggregator.address);
              });
          });

          describe("fund", () => {
              it("fails if you don't send enough eth", async () => {
                  await expect(fundMe.fund()).to.be.reverted;
              });

              it("updated the amount funded data structure", async () => {
                  await fundMe.fund({ value: sendValue1 });
                  const response = await fundMe.s_addressToAmountFunded(
                      deployer
                  );
                  assert.equal(response.toString(), sendValue1.toString());
              });

              it("add funder to array of s_funders", async () => {
                  await fundMe.fund({ value: sendValue1 });
                  const response = await fundMe.s_funders(0); // feels like shouldn't treat it as an array, 0 is the parameter in the (get)s_funders() function
                  assert.equal(response, deployer);
              });
          });

          describe("withdraw", () => {
              // we want some eth in the contract before we test
              // add a new beforeEach

              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue1 });
              });

              it("deployer gets the money back", async () => {
                  // Arrange
                  const startingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const startingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  );

                  // Act
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  );

                  // Assert
                  assert.equal(endingFundMeBalance.toString(), "0");
                  assert.equal(
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  );
              });

              it("allows us to withdraw with multiple s_funders", async () => {
                  // create different users/s_funders
                  const accounts = await ethers.getSigners();
                  const accountOne = accounts[1];
                  // console.log(accountOne);
                  // console.log(deployer);

                  // each user donote to the funding pool
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue1 });
                  }

                  //Arrange
                  const startingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const startingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  );

                  // Act
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  );

                  // Assert
                  assert.equal(endingFundMeBalance.toString(), "0");
                  assert.equal(
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  );

                  // Make sure s_funders are reset properly
                  await expect(fundMe.s_funders({ value: 0 })).to.be.reverted;

                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.s_addressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      );
                  }
              });

              it("the owner can only have the withdraw", async () => {
                  const accounts = await ethers.getSigners();
                  const attacker = accounts[1];
                  const attackerFundMeContract = await fundMe.connect(attacker);

                  await expect(
                      attackerFundMeContract.withdraw()
                  ).to.be.revertedWith("FundMe__NotOwner");
              });

              it("testing cheaperWithdraw....", async () => {
                  // create different users/s_funders
                  const accounts = await ethers.getSigners();
                  const accountOne = accounts[1];
                  // console.log(accountOne);
                  // console.log(deployer);

                  // each user donote to the funding pool
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue1 });
                  }

                  //Arrange
                  const startingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const startingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  );

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  );

                  // Assert
                  assert.equal(endingFundMeBalance.toString(), "0");
                  assert.equal(
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  );

                  // Make sure s_funders are reset properly
                  await expect(fundMe.s_funders({ value: 0 })).to.be.reverted;

                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.s_addressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      );
                  }
              });
          });
      });
