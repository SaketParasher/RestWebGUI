var environment = {};

environment.staging = {
  httpPort: 4000,
  httpsPort: 4001,
  envName: "staging",
  hashingSecret: "thisIsAHashingSecret",
  maxChecks: 5,
  twilio: {
    accountSid: "AC415e5f8009feacf33670a36dd62a3dbb",
    authToken: "06527706062f5acd760f7dc3edf08774",
    fromPhone: "+917019609525"
  },
  nexmo: {
    apiKey: "451470fb",
    apiSecret: "SKQxGfwPcudkp1HL"
  }
};

environment.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: "production",
  hashingSecret: "thisIsAanotherHashingSecret",
  maxChecks: 5,
  twilio: {
    accountSid: "AC415e5f8009feacf33670a36dd62a3dbb",
    authToken: "06527706062f5acd760f7dc3edf08774",
    fromPhone: "+917019609525"
  },
  nexmo: {
    apiKey: "451470fb",
    apiSecret: "SKQxGfwPcudkp1HL"
  }
};

var runEnv =
  typeof environment[process.env.NODE_ENV] != "undefined"
    ? process.env.NODE_ENV
    : "staging";

var envToExport = environment[runEnv];

console.log(runEnv, envToExport);

module.exports = envToExport;
