const xhr = new XMLHttpRequest();
const usdPriceClassName = 'usd-price'
var exchangeRate = undefined;
var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
var priceHTMLArray = [...document.getElementsByClassName("schema-product__price")];


// make a request to NBRB's api to get USD/BYN exchange rate
function getExchangeRate() {
  xhr.open("GET", "https://www.nbrb.by/api/exrates/rates/431");
  xhr.send();
  xhr.onload = function() {
    if (xhr.status === 200) {
      data = JSON.parse(xhr.responseText)
      exchangeRate = data['Cur_OfficialRate']
    } else if (xhr.status === 404) {
      console.log("No records found")
    }
  }
}

// listens for the update on the product list (products are loaded asynchronously)
var productListObserver = new MutationObserver(function(mutations) {
  let productAdded = false;
  for(let mutation of mutations) {
        for(let addedNode of mutation.addedNodes) {
            if (addedNode.nodeName == "DIV") {
              productAdded = true
            }
        }
    }
  if (productAdded) {
    main();
  }
});



function getPriceHTMLArray() {
  priceHTMLArray = [...document.getElementsByClassName("schema-product__price")];
}

function convertPrice(priceBYN) {
  return Math.round(priceBYN / exchangeRate) + ' $';
}

function addPriceCatalogUI(priceHtml, priceBYNValue){
  var pHtml = document.createElement("P");
  pHtml.innerHTML ='от ' +  convertPrice(priceBYNValue);
  pHtml.className = usdPriceClassName;
  priceHtml.style.display = 'inline-block';
  priceHtml.style.flexDirection = 'column-reverse';
  priceHtml.style.justifyContent = 'center';
  priceHtml.style.alignItems = 'center';
  priceHtml.appendChild(pHtml);
}

function checkUSDPricePresent(priceHTML){
  pHTML = priceHTML.getElementsByClassName(usdPriceClassName)
  if (pHTML.length != 0) {
    pHTML[0].innerHTML = 'от ' + convertPrice(priceValue);
    return true;
  }
  return false;
}

function modifyCatalogPrices() {
  for (let priceHTML of priceHTMLArray) {
    let priceBYN = priceHTML.getElementsByTagName('a')[0].getElementsByTagName('span')[0].innerHTML;
    priceHTML.getElementsByTagName('a')[0].style.color = '#808080';
    let priceMatch = /\d+(,\d+)?/.exec(priceBYN);
    if (priceMatch) {
      priceValue = Number(priceMatch[0].replace(',', '.'));
      if (!checkUSDPricePresent(priceHTML)) {
        addPriceCatalogUI(priceHTML, priceValue);
      }
    } else console.log("didnt find anything.");
  }
}

function main() {
  getPriceHTMLArray();
  modifyCatalogPrices();
}

getExchangeRate();
productListObserver.observe(document.getElementById("schema-products"), {
  childList: true,
  subtree: true,
});
