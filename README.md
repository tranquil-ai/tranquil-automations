# Pulsar Automations Package

## Overview

The Pulsar Automations Package is an extension for the Pulsar IDE, an Electron-based development environment. This package empowers developers to create and execute business workflow automations using JavaScript directly within the IDE. With a simple hotkey (Ctrl + Shift + E), users can run their automation scripts seamlessly.

---

## Key Features

- **Easy Integration**: Leverage popular libraries like Puppeteer and TranquilScript to create powerful automations.
- **Streamlined Workflow**: Run automation scripts directly from the IDE with minimal setup.
- **Extensibility**: Customize scripts to meet unique business workflow requirements.

---

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Add the package to Pulsar IDE:
   - Open Pulsar.
   - Navigate to `Settings` -> `Packages`.
   - Click on `Install` and search for `Pulsar Automations Package`.
   - Install the package.
4. To open Websocket URL

---

## Usage

1. Open the Pulsar IDE.
2. Create a new JavaScript file or use an existing one.
3. Write your automation script (see [Example Script](#example-script)).
4. Press `Ctrl + Shift + E` to execute the script.

---

## **Understanding the Automation Script**

This document explains the provided automation script and the necessary changes to integrate Puppeteer with the TranquilScript library for enhanced functionality.

---

## Overview

The script demonstrates how to open a webpage using Puppeteer in conjunction with TranquilScript. TranquilScript provides additional tools to manage browser pages and streamline automation workflows.

---

## Key Points

1. **Opening a Web Page**: The script is designed to open any URL by leveraging Puppeteer's functionality.
2. **Using TranquilScript**: To fully utilize the TranquilScript library, a slight modification to Puppeteer's default method for creating a new page is required.
3. **Exposing DevTools URL**: To enable automation with this package, you must expose the `devtoolsUrl` for Puppeteer. This requires setting the remote debugging port in the Pulsar application's `start.js` file.

---

## Modifications for Puppeteer

To ensure the integration works seamlessly, replace Puppeteer's default method for creating a new page:

### Original Puppeteer Code

```javascript
const page = await browser.newPage();
```

### Updated Code with TranquilScript

```javascript
const page = await TS.newPage(browser);
```

### Explanation

- **`TS.newPage(browser)`**: This method leverages the TranquilScript library to create a new page object. It integrates with the TranquilScript environment to ensure compatibility with its advanced features.

---

## Exposing DevTools URL

To enable automation, the DevTools URL must be exposed. Add the following code to the `start.js` file of the Pulsar application before `app.ready` is called:

```javascript
app.commandLine.appendSwitch("remote-debugging-port", "9222"); // Set the remote debugging port to 9222
```

This sets up the remote debugging port necessary for Puppeteer to connect to the browser instance.

---

## Script Purpose

This script automates the process of opening a webpage. For example, the provided code navigates to the Amazon homepage. The URL can be replaced with any desired link to customize the automation.

### Example Script

```javascript
const puppeteer = require("puppeteer-core");
const fs = require("fs");

const { TranquilScript } = require("tranquil-script");

const TS = new TranquilScript();
(async () => {
  const wsUrl = TS.getWebsocketUrl();
  console.log("wsUrl", wsUrl);

  const browser = await puppeteer.connect({
    browserWSEndpoint: wsUrl,
    ignoreHTTPSErrors: true,
    defaultViewport: null,
    headless: true,
  });

  const page = await TS.newPage(browser);
  await page.goto("https://www.example.com", {
    waitUntil: "load",
    timeout: 60000,
  });
})();
```

---

## Summary

1. **Purpose**: The script automates opening any URL in a browser.
2. **Key Modification**: Replace `browser.newPage()` with `TS.newPage(browser)` to integrate TranquilScript.
3. **Customization**: Modify the `page.goto()` URL to navigate to a different webpage.

By following these guidelines, you can adapt the script to suit various automation workflows efficiently.

## Hotkeys

- **Ctrl + Shift + E**: Run the currently open automation script.

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

## Contact

For support or inquiries, please open an issue on the GitHub repository.
