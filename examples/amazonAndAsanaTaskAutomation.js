const puppeteer = require("puppeteer-core");
const { TranquilScript } = require("tranquil-script");

// Set asana login email and password
const passwords = { asana: { email: "email", password: "password" } };

const TS = new TranquilScript();
(async () => {
  const wsUrl = TS.getWebsocketUrl();
  const browser = await puppeteer.connect({
    browserWSEndpoint: wsUrl,
  });
  const page = await TS.newPage(browser);
  await page.goto("https://www.amazon.com", {
    waitUntil: "load",
    timeout: 60000,
  });
  // Search for "chocolate"
  await page.type("#twotabsearchtextbox", "chocolate");
  // Search input selector
  await page.click("#nav-search-submit-button");
  // Search button selector
  await page.waitForSelector(".s-main-slot");
  await page.waitForTimeout(3000);
  // Extract top 10 results
  const results = await page.evaluate(() => {
    const items = [];
    const resultsSelector = ".s-main-slot .s-result-item";
    const resultElements = document.querySelectorAll(resultsSelector);

    for (let i = 0; i < resultElements.length && items.length < 10; i++) {
      const titleElement = resultElements[i].querySelector("h2 span");
      const priceWholeElement =
        resultElements[i].querySelector(".a-price-whole");
      const priceFractionElement =
        resultElements[i].querySelector(".a-price-fraction");
      const linkElement = resultElements[i].querySelector(".a-link-normal");

      if (titleElement && linkElement) {
        items.push({
          title: titleElement.innerText.trim(),
          price: priceWholeElement
            ? `$${priceWholeElement.innerText.trim()}${
                priceFractionElement
                  ? "." + priceFractionElement.innerText.trim()
                  : ""
              }`
            : "Price not available",
          link: linkElement.href,
        });
      }
    }
    return items;
  });
  const pagex = await TS.newPage(browser);

  await pagex.goto("https://app.asana.com/-/login", {
    waitUntil: "load",
    timeout: 60000,
  });
  await pagex.type('[type="email"]', passwords?.asana?.email);
  await pagex.click(".LoginButton");
  await pagex.waitForSelector('[type="password"]');
  await pagex.type('[type="password"]', passwords?.asana?.password);
  await pagex.click(".LoginButton");
  await pagex.waitForNavigation(5000);
  await pagex.waitForSelector('[aria-label="Create"]');
  await pagex.click('[aria-label="Create"]');
  await pagex.waitForSelector(".Omnibutton-task");
  await pagex.click(".Omnibutton-task");
  await pagex.waitForSelector('[placeholder="Task name"]');

  await pagex.type('[placeholder="Task name"]', results[0].title);
  await pagex.evaluate((results) => {
    const descEl = document.querySelectorAll(".ProsemirrorEditor-paragraph");
    descEl[descEl.length - 1].innerText = results[0].link;
  }, results);
  await page.waitForTimeout(2000);
  await pagex.click('[aria-label="Create task"]');
})();
