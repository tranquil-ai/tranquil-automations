const { CompositeDisposable } = require("atom");
// const puppeteer = require('puppeteer-core');
// const { WebViewController } = require("./webview-controller.js");
class TranquilScript {
  // Static array to hold all instances of the class
  static instances = [];
  subscriptions = null;
  currentWebView = null;
  #command = "";
  static websocketUrl = "";
  saveSubscriptionCallback = null;
  constructor() {
    this.#createNewSubscriptions();
    if (!this.getWebsocketUrl()) {
      TranquilScript.fetchWebsocketUrl();
    }
    TranquilScript.instances.push(this);
  }
  // Static method to get all instances
  static getAllInstances() {
    return TranquilScript.instances;
  }

  getWebsocketUrl() {
    return TranquilScript.websocketUrl;
  }

  getCommand() {
    return this.#command;
  }

  // Initialize the class with a command and callback
  registerCommand(command, callback) {
    this.#command = command;
    this.saveSubscriptionCallback = this.#addCommand(command, callback);
    this.#addSubscriptions(this.saveSubscriptionCallback);
  }

  // async newPage(options) {
  //   atom.workspace.open("tranquil-browser://blank", options);
  //   const getWebviewObject = new Promise((resolve) => {
  //     atom.workspace.onDidAddPaneItem((paneItem) => {
  //       const webview = paneItem?.item;
  //       resolve(webview);
  //     });
  //   });
  //   const webviewObj = await getWebviewObject;
  //   const webview = webviewObj?.view?.htmlv?.[0];
  //   return new WebViewController(webview);
  // }

  // Function to create new subscriptions
  #createNewSubscriptions = () => {
    this.subscriptions = new CompositeDisposable();
  };

  // Function to add a command to the atom workspace
  #addCommand = (command, callback) => {
    return atom.commands.add("atom-workspace", {
      [command]: () => {
        console.log(`[INFO] command subscribed to Tranquil :: ${command}`);
        callback();
      },
    });
  };

  // Function to add a subscription
  #addSubscriptions = (subscription) => {
    return this.subscriptions.add(subscription);
  };

  // Deactivate a subscription
  deactivate() {
    this.subscriptions.dispose();
    this.subscriptions.remove(this.saveSubscriptionCallback);
    console.log(`[INFO] command unsubscribed successful :: ${this.command}`);
  }

  // Clear all subscriptions
  clearAllSubscriptions() {
    // Getting all instances
    const allInstances = TranquilScript.getAllInstances();
    allInstances.forEach((instance) => {
      instance.deactivate();
      instance = null;
    });
    TranquilScript.instances = [];
    console.log("[INFO] Clearing all subscriptions");
  }

  // Clear all subscriptions except the current instance
  clearAllSubscriptionsExceptCurrent(current) {
    // Getting all instances
    const allInstances = TranquilScript.getAllInstances();
    allInstances.forEach((instance) => {
      if (instance !== current) {
        instance.deactivate();
        instance = null;
      }
    });
    TranquilScript.instances = [current];
  }

  static fetchWebsocketUrl(apiUrl = "http://localhost:9222/json/version") {
    return fetch(apiUrl)
      .then((response) => {
        // Check if the response is ok (status in the range 200-299)
        if (!response.ok) {
          throw new Error("Network response was not ok " + response.statusText);
        }
        return response.json(); // Convert response to JSON
      })
      .then((data) => {
        console.log("Data fetched from the mock API:", data); // Process the data
        TranquilScript.websocketUrl = data?.webSocketDebuggerUrl;
        return data?.webSocketDebuggerUrl;
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
      });
  }

  async waitForTimeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getCurrentWebview() {
    return this.currentWebView;
  }

  async newPage(browser) {
    const webViewObj = await atom.workspace.open("tranquil-browser://blank");
    this.currentWebView = webViewObj?.view?.htmlv?.[0];
    await this.waitForTimeout(1000);
    const targets = await browser.targets();
    const webviewTarget = targets.find((target) => {
      return (
        target.url().includes("tranquil-browser://blank") &&
        target.type() === "webview"
      );
    });
    webViewObj?.view?.url.val("");

    if (webviewTarget) {
      const page = await webviewTarget.page(); // Get the page for the webview
      page.evaluate = this.evaluate;
      return page;
    }
  }
  evaluate = async (pageFunction, ...args) => {
    if (typeof pageFunction !== "function") {
      throw new Error("The first argument must be a function.");
    }
    const serializedFunction = `(${pageFunction.toString()})(...${JSON.stringify(
      args
    )})`;
    return await this.currentWebView?.executeJavaScript(serializedFunction);
  };
}

module.exports = { TranquilScript };
