const xhr = new XMLHttpRequest();
const usdPriceClassName = 'usd-price'
var exchangeRate = undefined;
var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;


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
  let priceMatch = /\d+(,\d+)?/.exec(priceString);
  return Number(priceMatch[0].replace(',', '.'));
}
function modifyProductPagePrice() {
  
  let mainPriceDiv = document.getElementsByClassName("offers-description__price offers-description__price_primary")[0];
  let mainPriceValue = getNumberFromPrice(mainPriceDiv.getElementsByTagName('A')[0].innerHTML);
  let mainPriceUSD = convertPrice(mainPriceValue);
  modifyUIPrice(mainPriceDiv, mainPriceUSD);
  
  
}

function modifyAsidePrices(){
  let target = [...document.getElementsByClassName("product-aside__description product-aside__description_alter product-aside__description_font-weight_bold product-aside__description_ellipsis product-aside__description_huge--additional")];
  for (let store of target) {
    let priceBYN = getNumberFromPrice(store.getElementsByTagName('A')[0].getElementsByTagName('SPAN')[0].innerHTML);
    modifyUIPrice(store,  convertPrice(priceBYN));
  }
}
function addProductMainPriceUI(mainPriceUSD){
  let mainPriceDiv = document.getElementsByClassName("offers-description__price offers-description__price_primary")[0];
  let pHTML = document.createElement("P");
  pHTML.innerHTML = mainPriceUSD;
  pHTML.className = usdPriceClassName;
  mainPriceDiv.style.display = 'inline-block';
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
function modifyUIPrice(divTag, priceUSD){
  let pHTML = divTag.getElementsByClassName(usdPriceClassName)
  if (pHTML.length != 0) {
    pHTML[0].innerHTML = priceUSD;
    return;
  } 
  divTag.getElementsByTagName('a')[0].style.color = '#808080';
  pHTML = document.createElement("P");
  pHTML.innerHTML = priceUSD;
  pHTML.className = usdPriceClassName;
  divTag.style.display = 'inline-block';
  divTag.appendChild(pHTML);
}
function modifyRecommendedProductPrices(){
  let recommendations = [...document.getElementsByClassName("product-recommended__price")];
  for (let recommendation of recommendations) {
    let priceBYN = getNumberFromPrice(recommendation.getElementsByTagName('A')[0].getElementsByTagName('SPAN')[0].innerHTML);
    modifyUIPrice(recommendation,  convertPrice(priceBYN));
  }
}


function convertPrice(priceBYN) {
  return Math.round(priceBYN / exchangeRate) + ' $';
}

function modifyCatalogPrices() {
  let priceHTMLArray = [...document.getElementsByClassName("schema-product__price")];
  for (let priceHTML of priceHTMLArray) {
    let priceBYN = getNumberFromPrice(priceHTML.getElementsByTagName('a')[0].getElementsByTagName('span')[0].innerHTML);
    modifyUIPrice(priceHTML, convertPrice(priceBYN));
  }
}

function main() {
  switch (currentPage){
    case Pages.ProductList:
      modifyCatalogPrices();
      break;
    case Pages.Product:
      modifyProductPagePrice();
      modifyAsidePrices();
      modifyRecommendedProductPrices();
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
