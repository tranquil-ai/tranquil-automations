class WebViewController {
  constructor(webview, options = {}) {
    this.webview = webview;
    this.timeout = options.timeout || 5000;
    // Ensure the webview is ready before executing any commands
    this.webview.addEventListener("dom-ready", () => {
      console.log("WebView is ready");
    });
  }

  async waitForTimeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async waitForSelector(selector, timeout = 5000) {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkExistence = () => {
        this.webview
          .executeJavaScript(`document.querySelector('${selector}') !== null`)
          .then((exists) => {
            if (exists) {
              console.log("[INFO] selector found");
              resolve(true);
            } else if (Date.now() - startTime > timeout) {
              reject(new Error(`Timeout exceeded: ${selector} not found`));
            } else {
              setTimeout(checkExistence, 100); // Retry every 100ms
            }
          });
      };
      checkExistence();
    });
  }

  async waitForNavigation(timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Navigation timeout exceeded"));
      }, timeout);

      const handleLoad = () => {
        clearTimeout(timeoutId);
        this.webview.removeEventListener("did-finish-load", handleLoad);
        resolve();
      };

      this.webview.addEventListener("did-finish-load", handleLoad);
    });
  }

  // Method to navigate to a new URL
  async goto(url) {
    console.log("[INFO] goto started");
    this.webview.loadURL(url);
    console.log("[INFO] goto finished");
    return this.webview;
  }

  // Method to execute script inside webview
  async evaluate(script) {
    console.log("[INFO] evaluate started");
    this.webview.executeJavaScript(`(()=>{
        ${script}
        })()`);
    console.log("[INFO] evaluate finished");
    return this.webview;
  }

  evaluateHandle(fn, ...args) {
    let webview = this.webview;
    const functionString = fn.toString();
    // If args are not provided, default to an empty array
    const argsString = args.length > 0 ? JSON.stringify(args) : "[]";
    const script = `
    (function() {
      const result = (${functionString})(...${argsString});
      if(result instanceof Node) {
         window.evaluateHandle = result;
      }
    })();
  `;

    // Execute the script within the WebView
    webview.executeJavaScript(script);
    // Create the object and handler for proxying
    const myObject = {};
    const handler = {
      get(target, propKey, receiver) {
        if (typeof target[propKey] === "function") {
          return function (...args) {
            console.log(`[INFO] Method called: ${propKey}`);
            return target[propKey].apply(this, args);
          };
        } else {
          // Define a new function dynamically for the undefined method
          const dynamicMethod = function () {
            const script = `
              (function() {
                return window.evaluateHandle instanceof Node ? window.evaluateHandle.${propKey}() : null;
              })();
            `;

            // Execute the script within the WebView
            webview.executeJavaScript(script);
            console.log(`Undefined method called: ${propKey}`);
          };

          Object.defineProperty(dynamicMethod, "name", {
            value: propKey,
            writable: false,
          });

          return dynamicMethod;
        }
      },
    };

    // Return a Proxy wrapping myObject
    return new Proxy(myObject, handler);
  }

  // Method to click an element by selector
  async click(selector) {
    console.log("[INFO] click started");
    const script = `
      (() => {
        const element = document.querySelector('${selector}');
        if (element) {
          element.click();
          return true;
        }
        return false;
      })();
    `;
    this.webview.executeJavaScript(script);
    console.log("[INFO] click finished");
    return this.webview;
  }

  // Method to type into an input element
  async type(selector, text) {
    console.log("[INFO] type started");
    const script = `
      (() => {
        const element = document.querySelector('${selector}');
        if (element) {
            element.focus();
            element.value = '';
            document.execCommand('insertText', false, '${text}');
        }
      })();
    `;
    this.webview.executeJavaScript(script);
    console.log("[INFO] type finished");
    return this.webview;
  }

  async typePolyfill(selector, text, delay = 100) {
    console.log("[INFO] typePolyfill started");
    const script = `
      (async () => {
        const element = document.querySelector('${selector}');
        for (const char of '${text}') {
            if(element){ 
              element.value += char;
            }else {
              element.value=char
            }
        // Trigger input events to simulate user typing
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        // Delay between keystrokes
        await new Promise(resolve => setTimeout(resolve, ${delay}));
        }}
       )();
    `;
    this.webview.executeJavaScript(script);
    console.log("[INFO] type finished");
    return this.webview;
  }
}

module.exports = { WebViewController };
