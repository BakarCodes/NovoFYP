const rp = require('request-promise');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const fs = require('fs');
const axios = require('axios');
const { compareDocumentPosition } = require('domutils');
const request = require('request');
const dom = new jsdom.JSDOM();
const document = dom.window.document;

// Function to invoke the serverless function
async function invokeServerlessFunction(query) {
  try {
    // Send a POST request to the serverless function's URL with the query parameter
    const response = await axios.post(
      'https://your-site.com/.netlify/functions/your-function',
      {
        query: query,
      }
    );

    // Do something with the response data (e.g. update the page with the scraped data)
  } catch (error) {
    // Handle the error (e.g. log it to the console)
    console.error(error);
  }
}

// Add a submit event listener to the form
const form = document.getElementById('search-form');
form.addEventListener('submit', function(event) {
  // Prevent the default action (refresh the page)
  event.preventDefault();

  // Get the value of the query element
  const query = document.getElementById('query-input').value;

  // Invoke the serverless function with the query parameter
  invokeServerlessFunction(query);
});

// Lambda function to handle the request and call the main function
exports.handler = async (event, context) => {
  // Get the query parameter from the event object
  const query = event.queryStringParameters.query;

  // Call the main function with the query
  const data = await main(query);

  // Return a response with the scraped data
  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};
 

async function main(query) {
  // Initialize an empty array to store the scraped data
  let scrapedData = [];
  
  // Get the product links from the ebayProducts function
  const ebayProductLinks = await ebayProducts(query);
  
  // Pass the product links to the ebayResults function
  await ebayResults(ebayProductLinks, scrapedData);
  
  // Get the product links from the depopProducts function
  const productLinks = await depopProducts(query);
  
  // Pass the product links to the depopResults function
  await depopResults(productLinks, scrapedData);
  
  // Return the scraped data
  return scrapedData;
}

async function ebayProducts(query) {
  // Create a new session
  let session = rp.jar();

  // Construct the URL with the query parameter
  let url = `https://www.ebay.co.uk/sch/i.html?_from=R40&_nkw=${query}&_sacat=0&LH_ItemCondition=4&rt=nc&LH_BIN=1`;
  // Set the user agent to mimic a web browser
  let userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36';

  // Set the user agent in the session
  let options = {
    uri: url,
    headers: { 'User-Agent': userAgent },
    jar: session,
  };

  // Make a GET request to the URL
  let response = await rp(options);

  // Parse the HTML content of the page
  let dom = new JSDOM(response);

  // Create a new set to store the product links
  let ebayProductLinks = new Set();

  // Find all `a` tags on the page with `href` attributes that start with "https://www.ebay.co.uk/itm"
  let aTags = dom.window.document.querySelectorAll('a[href^="https://www.ebay.co.uk/itm"]');
  aTags.forEach((aTag) => {
    // Add the `href` attribute of the `a` tag to the set of product links
    ebayProductLinks.add(aTag.href);
  // Stop after adding the fifth link to the set of product links
    if (ebayProductLinks.size === 3) {
      return;
    }
  });
  //console.log(ebayProductLinks)
  // Return the list of product links
  return Array.from(ebayProductLinks);
}

async function ebayResults(ebayProductLinks,scrapedData) {
  // Create a new session
  let session = rp.jar();

  // Loop through each product link
  for (let i = 0; i < 3; i++) {
    // Construct the URL with the product link
    let url = ebayProductLinks[i];
    // Set the user agent to mimic a web browser
    let userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36';
    // Set the user agent in the session
    let options = {
      uri: url,
      headers: { 'User-Agent': userAgent },
      jar: session,
    };

    try {
      // Make a GET request to the URL
      let response = await rp(options);
      
      // Parse the HTML content of the page
      let dom = new JSDOM(response);

      // Find the first image on the page with an `alt` attribute
      let images = dom.window.document.querySelectorAll('img[alt]');

      // Convert the NodeList to an array
      images = Array.from(images);

      // Filter the images to keep only those that end with ".jpg"
      images = images.filter(image => /\.jpg$/i.test(image.src));


      let imgSrc = images[5].src;
      imgSrc = imgSrc.toString().replace("s-l96", "s-l500").replace("s-l64", "s-l500");
      
      let altText = dom.window.document.querySelector('h1.x-item-title__mainTitle').textContent;

      // Find the element with the span element with the itemprop='price' attribute
      let priceElement = dom.window.document.querySelector('span[itemprop="price"]');

      // Extract the text inside the span element, removing any leading or trailing whitespace
      let priceText = priceElement.textContent.trim();


      // Add the data to the array
      let data = {
        Company: 'EBAY ',
        alt: altText,
        price: priceText,
        img_src: imgSrc,
        url: ebayProductLinks[i],
      };
      scrapedData.push(data); 
    } catch (error) {
      // Print the error if there was a problem making the request or parsing the page
      console.error(error);
    }
  }

  // Do something with the scraped data (e.g. console.log it)
  // Write the scraped data to the 'json/ebay_data.json' file
  return scrapedData;
}



async function depopProducts(query) {
  // Create a new session
  let session = rp.jar();

  // Construct the URL with the query parameter
  let url = `https://www.depop.com/search/?q=${query}`;
  // Set the user agent to mimic a web browser
  let userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36';

  // Set the user agent in the session
  let options = {
    uri: url,
    headers: { 'User-Agent': userAgent },
    jar: session,
  };

  // Make a GET request to the URL
  let response = await rp(options);

  // Parse the HTML content of the page
  let dom = new JSDOM(response);

  // Create a new set to store the product links
  let productLinks = new Set();

  // Find all `a` tags on the page with `href` attributes that start with "/listing"
  let aTags = dom.window.document.querySelectorAll('a[href^="/products"]');
  aTags.forEach((aTag) => {
    // Add the `href` attribute of the `a` tag to the set of product links
    productLinks.add(aTag.href);
    // Stop after adding the fifth link to the set of product links
    if (productLinks.size === 3) {
      return;
    }
  });

  // Return the list of product links
  
  return Array.from(productLinks);

}


async function depopResults(productLinks,scrapedData) {
  // Create a new session
  let session = rp.jar();

  // Loop through each product link
  for (let i = 0; i < 3; i++) {
    // Construct the URL with the product link
    let url = `https://www.depop.com${productLinks[i]}`;
    // Set the user agent to mimic a web browser
    let userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36';
    // Set the user agent in the session
    let options = {
      uri: url,
      headers: { 'User-Agent': userAgent },
      jar: session,
    };

    try {
      // Make a GET request to the URL
      const response = await rp(options);
      //console.log(response);
      // Parse the HTML content of the page
      const dom = new JSDOM(response);

      // Find the first image on the page with an `alt` attribute
      const images = dom.window.document.querySelectorAll('img[alt]');
      const img_src = images[1].src;     

      // Find the first element on the page with the class `css-1x5ik5y`
      const priceElement = dom.window.document.querySelector('[data-testid="fullPrice"]');
      const priceText = priceElement.textContent;
      const price = priceText.match(/£\d+\.\d+/)[0];
      //console.log(price); // Output: "£24.99"


      // Get the product name from the product link
      const cleanedProductLink = productLinks[i]
        .replace('/products/', '')
        .replace('-', ' ')
        .replace('/', '')
        .replace(/^\S+\s/, '');

      // Add the scraped data to the array
      let data = {
        Company: "DEPOP",
        alt: cleanedProductLink,
        price: price,
        img_src: img_src,
        url: url,
      };
      scrapedData.push(data);      
    } catch (error) {
      // Print the error if there was a problem making the request or parsing the page
      //console.error(error);
    }
  }
  const dataJson = JSON.stringify(scrapedData);

  // Write the data to a file
  fs.writeFileSync('../JSON/scrapedData.json', dataJson);
  console.log(scrapedData);
  return scrapedData;
}


