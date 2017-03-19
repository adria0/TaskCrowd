var DefaultBuilder = require("truffle-default-builder");
module.exports = {
  build: new DefaultBuilder({
    "index.html" : "index.html",
    "app.js": [
      "js/skeleton-tabs.js",
      "js/blockies.js",
      "js/helper.js",
      "js/app.js"
    ],
    "app.css": [
      "css/skeleton-tabs.css",
      "css/app.css"
    ],
    "img/": "img/"
  }),
  networks: {
    ropsten: {
      host: "localhost",
      port: 8545,
      network_id: "3" // Match any network id
    },
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    }

  }
};
