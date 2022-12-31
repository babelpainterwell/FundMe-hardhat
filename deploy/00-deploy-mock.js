const { network } = require("hardhat");
const {
    developmentChains,
    DECIMAL,
    INITIAL_ANSWER
} = require("../helper-hardhat-config");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    // const chainId = network.config.chainId;

    if (developmentChains.includes(network.name)) {
        log("Development chain/network detected. Deploying mocks...");
        log(`The deployer is ${deployer}`);
        await deploy("MockV3Aggregator", {
            from: deployer,
            args: [DECIMAL, INITIAL_ANSWER],
            log: true
        });
        log("-------------Mock Deployed-------------");
    }
};

// a way to only run deploy-mock?
module.exports.tags = ["all", "mocks"];
