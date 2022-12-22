fetch('../JSON/scrapedData.json')
  .then(response => response.json())
  .then(data => {
    const img_srcs = data.slice(0, 6).map(item => item.img_src);
    const alt_texts = data.slice(0, 6).map(item => item.alt);
    const companies = data.slice(0, 6).map(item => item.Company);
    const prices = data.slice(0, 6).map(item => item.price);
    const urls = data.slice(0, 6).map(item => item.url);
    // Iterate over the img_src values
    for (let i = 0; i < img_srcs.length; i++) {
      // Create a new div element
      const div = document.createElement('div');

      // Set the class attribute of the div to "image-container"
      div.setAttribute('class', 'image-container');

      // Create an <img> element using the img_src value
      const img = document.createElement('img');
      img.src = img_srcs[i];
      img.className = 'image';

      // Create a new div for the alt text and set its inner text
      const altDiv = document.createElement('div');
      altDiv.innerText = alt_texts[i];

      // Create a new div for the company and set its inner text
      const companyDiv = document.createElement('div');
      companyDiv.innerText = companies[i];

      const button = document.createElement('button');
      button.innerText = 'VIEW PRODUCT';
      button.setAttribute('class', 'view-product-button');
      button.addEventListener('click', () => {
        window.open(urls[i]);
      });
      
      const priceDiv = document.createElement('div');
      priceDiv.innerText = prices[i];

      priceDiv.setAttribute('class', 'price');

      altDiv.setAttribute('class', 'alt')
      companyDiv.setAttribute("class", "company")
      // Append the company and alt text divs to the main div
      div.appendChild(companyDiv);
      div.appendChild(altDiv);
      div.appendChild(priceDiv);
      div.appendChild(button);
      // Append the image to the main div
      div.appendChild(img);
      

      // Append the div to the body of the HTML document
      document.body.appendChild(div);
    }
  });
function getCurrentTabUrl() {
    var queryInfo = {
      active: true,
      currentWindow: true
    };
    chrome.tabs.query(queryInfo, (tabs) => {
      var tab = tabs[0];
      var url = tab.url;
      console.assert(typeof url == 'string', 'tab.url should be a string');
      document.getElementById('get-url').textContent = url;
      console.log(url);
      
    });
}

document.querySelector('#get-url').addEventListener('click', getCurrentTabUrl)
  
  
  
