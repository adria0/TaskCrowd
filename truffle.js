require('babel-polyfill');

var DefaultBuilder = require("truffle-default-builder");
module.exports = {
  build: new DefaultBuilder({
    "index.html" : "index.html",
    "app.js": [
      "lib/skeleton-tabs/js/skeleton-tabs.js",
      "lib/blockies/js/blockies.js",
      "js/deploy.js",
      "js/helper.js",
      "js/app.js"
    ],
    "app.css": [
      "lib/skeleton-tabs/css/skeleton-tabs.css",
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
