//import

// main function

//calling main function

// function deployFunc() {
//     console.log("Hi");
// }

// module.exports.default = deployFunc;

const {
    networkConfig,
    developmentChains
} = require("../helper-hardhat-config");
const { network } = require("hardhat");
const { verify } = require("../Utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    // if chainId is x, use address y
    // if chainId is z, use address f
    let ethUsdPriceFeedAddress;

    if (developmentChains.includes(network.name)) {
        // get the most recent deployment
        const ethUsdAggregatorContract = await deployments.get(
            "MockV3Aggregator"
        );
        ethUsdPriceFeedAddress = ethUsdAggregatorContract.address;
    } else {
        ethUsdPriceFeedAddress =
            networkConfig[chainId]["ethUsdPriceFeedAddress"];
    }

    // for local networks, which may not have a price feed contract
    // create mock contracts: if the contract doesn't exist, we create a minimal version of it for our local testing
    const args = [ethUsdPriceFeedAddress];
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
    });

    if (
        !developmentChains.includes(network.name) &&
        process.env.COINMARKETCAP_API_KEY
    ) {
        await verify(fundMe.address, args);
    }

    log("------------FundMe Deployed------------");
};

module.exports.tags = ["all", "fundme"];
