const { developmentChains } = require("../../helper-hardhat-config");
const { ethers, getNamedAccounts, network } = require("hardhat");
const { assert } = require("chai");

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Staging test", () => {
          let deployer;
          let fundMe;
          const sendValue = ethers.utils.parseEther("0.1");
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer;
              fundMe = await ethers.getContract("FundMe", deployer);
          });

          it("allows people to fund and withdraw", async () => {
              const fundTxResponse = await fundMe.fund({
                  value: sendValue,
                  gasLimit: 3e7
              });
              await fundTxResponse.wait(1);
              const withdrawTxResponse = await fundMe.withdraw();
              await withdrawTxResponse.wait(1);

              // endingFundMeBalance = 0
              const endingFundMeBalance = await fundMe.provider.getBalance(
                  fundMe.address
              );
              assert.equal(endingFundMeBalance.toString(), "0");
          });
      });
