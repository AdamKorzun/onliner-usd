const usdPriceClassName = 'usd-price'
var exchangeRate = undefined;
var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;


const Pages = {
  Product : 'Product',
  ProductList: 'ProductList',
  Stores: 'Stores',
  Used: 'Used'
}

var currentPage = Pages.ProductList;

// bad solution 💀
function handleUrl() {
  let pathname = window.location.pathname;
  if (pathname.includes('prices')){
    currentPage = Pages.Stores;
  }
  else if (pathname.includes('used')){
    currentPage = Pages.Used;
  }
  else if (new RegExp('\/[a-zA-Z0-9]*\/[a-zA-Z0-9*]*\/[a-zA-Z0-9*]*').test(pathname)){
    currentPage = Pages.Product;
  }
}

function selectObserver() {
  // listens for the update on the product list (products are loaded asynchronously)
  var contentObserver = new MutationObserver(function(mutations) {
    let productAdded = false;
    for(let mutation of mutations) {
          for(let addedNode of mutation.addedNodes) {
              if (addedNode.nodeName == "DIV") {
                productAdded = true
              }
          }
      }
    if (productAdded) {
      handleObserverTarget();
    }
  });
  switch (currentPage) {
    case Pages.ProductList:
      var observerTarget = document.getElementById("schema-products");
      break;
    case Pages.Product:
      var observerTarget = document.getElementsByClassName("product product_details b-offers js-product")[0]; 
      break;
    case Pages.Stores:
      var observerTarget = document.getElementsByClassName('offers-filter__part offers-filter__part_2')[0];
      break;
    case Pages.Used:
      var observerTarget = document.getElementById('used-product-container');
      break;
    default:
      console.log('USDOnliner: Page is not supported yet!');
      return;
  }
  contentObserver.observe(observerTarget, {
    childList: true,
    subtree: true,
  });
}

// make a request to NBRB's api to get USD/BYN exchange rate
function getExchangeRate() {
  let promiseNBRB = new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    xhr.addEventListener("readystatechange", () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        let exchangeRate = JSON.parse(xhr.responseText)['Cur_OfficialRate'] 
        resolve(exchangeRate);
      } else if (xhr.readyState === 4) {
        reject("error getting resources");
      }
    });    
    xhr.open("GET", "https://www.nbrb.by/api/exrates/rates/431");
    xhr.send();
  })
  promiseAPI = new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    xhr.addEventListener("readystatechange", () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        let exchangeRate = JSON.parse(xhr.responseText)['usd']['byn'] 
        resolve(exchangeRate);
      } else if (xhr.readyState === 4) {
        reject("error getting resources");
      }
    });    
    xhr.open("GET", "https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/usd.json");
    xhr.send();
  })
  return [promiseNBRB, promiseAPI];
}

function getNumberFromPrice(priceString){
  priceString = priceString.replace(/\&nbsp;/g, '');
  priceString = priceString.replace(/\s+/g, '');
  let priceMatch = /\d+(,\d+)?/.exec(priceString);
  return Number(priceMatch[0].replace(',', '.'));
}

function modifyProductPagePrice() {
  let mainPriceDiv = document.getElementsByClassName("offers-description__price offers-description__price_primary")[0];
  let anchorTag = mainPriceDiv.getElementsByTagName('A');
  let mainPriceValue = undefined;
  if (anchorTag.length != 0){
    mainPriceValue = getNumberFromPrice(anchorTag[0].innerHTML);
  }
  else {
    mainPriceValue = getNumberFromPrice(mainPriceDiv.innerHTML);
  }
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

function modifyUIPrice(divTag, priceUSD){
  let pHTML = divTag.getElementsByClassName(usdPriceClassName)
  if (pHTML.length != 0) {
    pHTML[0].innerHTML = priceUSD;
    return;
  } 
  let anchorTag = divTag.getElementsByTagName('a')[0];
  if (anchorTag){
    anchorTag.style.color = '#808080';
  }
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
  if (isNaN(Math.round(priceBYN / exchangeRate))){
    return
  }
  return Math.round(priceBYN / exchangeRate) + ' $';
}

function modifyCatalogPrices() {
  let priceHTMLArray = [...document.getElementsByClassName("schema-product__price")];
  for (let priceHTML of priceHTMLArray) {
    let priceBYN = getNumberFromPrice(priceHTML.getElementsByTagName('a')[0].getElementsByTagName('span')[0].innerHTML);
    modifyUIPrice(priceHTML, convertPrice(priceBYN));
  }
}

function modifyStorePrice() {
  let priceHTMLArray = [...document.getElementsByClassName("offers-list__description offers-list__description_alter-other offers-list__description_huge-alter offers-list__description_font-weight_bold offers-list__description_ellipsis offers-list__description_nodecor")];
  for (let priceHTML of priceHTMLArray) {
    let priceBYN = getNumberFromPrice(priceHTML.innerHTML);
    modifyUIPrice(priceHTML, convertPrice(priceBYN));
  }
}

function modifyUsedPrices() {
  let priceHTMLArray = [...document.getElementsByClassName("offers-list__price offers-list__price_secondary")];
  for (let priceHTML of priceHTMLArray) {
    let priceBYN = getNumberFromPrice(priceHTML.innerHTML);
    modifyUIPrice(priceHTML, convertPrice(priceBYN));
  }
}

function handlePages() {
  switch (currentPage){
    case Pages.ProductList:
      modifyCatalogPrices();
      break;
    case Pages.Product:
      modifyProductPagePrice();
      modifyAsidePrices();
      modifyRecommendedProductPrices();
      break;
    case Pages.Stores:
      modifyProductPagePrice();
      modifyStorePrice();
      break;
    case Pages.Used:
      modifyProductPagePrice();
      modifyUsedPrices();
      break;
    default:
      console.log('USDOnliner: Page is not supported yet');
  }
}

function handleObserverTarget() {
  Promise.any(getExchangeRate()).then((er) => {
    this.exchangeRate = er;
    handlePages();
  })
}

function main(){
  handleUrl();
  selectObserver();
}

main();
