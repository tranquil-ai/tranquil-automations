"use babel";
const { ipcRenderer } = require("electron");
const { TranquilScript } = require("./tranquil-script.js");
const { initializeNewOnSaveSubscription } = require("./utils.js");
const Module = require("module");
const originalRequire = Module.prototype.require;
export default {
  runInTerminal: null,

  activate(state) {
    console.log("tranquil-automations activated");
    // Add alias for tranquil-script import in ide
    Module.prototype.require = function (moduleName) {
      if (moduleName === "tranquil-script") {
        return originalRequire.call(this, "./tranquil-script.js");
      }
      return originalRequire.call(this, moduleName);
    };
    initializeNewOnSaveSubscription(this, TranquilScript, atom);
  },

  consumeRunInTerminal(service) {
    this.runInTerminal = service;
  },

  serialize() {
    return {
      TranquilViewState: null,
    };
  },
};
