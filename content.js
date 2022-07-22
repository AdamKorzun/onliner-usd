const xhr = new XMLHttpRequest();
const usdPriceClassName = 'usd-price'
var exchangeRate = undefined;
var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
var priceHTMLArray = [...document.getElementsByClassName("schema-product__price")];


const Pages = {
  Product : 'Product',
  ProductList: 'ProductList'
}

var currentPage = Pages.ProductList;

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

function getNumberFromPrice(priceString){
  priceString = priceString.replace(/\&nbsp;/g, '');
  priceString = priceString.replace(/\s+/g, '');
  console.log(priceString);
  let priceMatch = /\d+(,\d+)?/.exec(priceString);
  return Number(priceMatch[0].replace(',', '.'));
}
function modifyProductPagePrice() {
  
  let mainPriceHTML = document.getElementsByClassName("offers-description__link offers-description__link_nodecor js-description-price-link")[0].innerHTML; 
  let mainPriceValue = getNumberFromPrice(mainPriceHTML);
  let mainPriceUSD = convertPrice(mainPriceValue);
  let mainPriceDiv = document.getElementsByClassName("offers-description__price offers-description__price_primary")[0];
  pHTML = mainPriceDiv.getElementsByClassName(usdPriceClassName)
  if (pHTML.length != 0) {
    pHTML[0].innerHTML = mainPriceUSD;
  }
  else {
    addProductMainPriceUI(mainPriceUSD);
  }
  
}

function addProductMainPriceUI(mainPriceUSD){
  let mainPriceDiv = document.getElementsByClassName("offers-description__price offers-description__price_primary")[0];
  console.log(mainPriceDiv);
  let pHTML = document.createElement("P");
  pHTML.innerHTML = mainPriceUSD;
  pHTML.className = usdPriceClassName;
  mainPriceDiv.style.display = 'inline-block';
  console.log(mainPriceDiv)
  mainPriceDiv.appendChild(pHTML);
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
    setTimeout(main,1000);
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
  priceHtml.appendChild(pHtml);
}

function checkUSDPricePresent(priceHTML){
  pHTML = priceHTML.getElementsByClassName(usdPriceClassName)
  if (pHTML.length != 0) {
    pHTML[0].innerHTML = convertPrice(priceValue);
    return true;
  }
  return false;
}

function modifyCatalogPrices() {
  for (let priceHTML of priceHTMLArray) {
    let priceBYN = priceHTML.getElementsByTagName('a')[0].getElementsByTagName('span')[0].innerHTML;
    priceHTML.getElementsByTagName('a')[0].style.color = '#808080';
    priceValue = getNumberFromPrice(priceBYN);
    if (!checkUSDPricePresent(priceHTML)) {
      addPriceCatalogUI(priceHTML, priceValue);
    }
  
  }
}

function main() {
  getPriceHTMLArray();
  switch (currentPage){
    case Pages.ProductList:
      modifyCatalogPrices();
      break;
    case Pages.Product:
      modifyProductPagePrice();
      break;
    default:
      console.log('Page is not supported yet');
  }
}

getExchangeRate();

let oberserverTarget = document.getElementById("schema-products");

if (!oberserverTarget) {
  oberserverTarget = document.getElementsByClassName("product product_details b-offers js-product")[0]; 
  currentPage = Pages.Product;
}
// console.log(window.location.toString());
productListObserver.observe(oberserverTarget, {
  childList: true,
  subtree: true,
});
