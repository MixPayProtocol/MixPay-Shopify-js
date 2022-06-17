import ShopifyModal from "./shopify-modal";
import APIS from "./api";
import { query, createEle, setStyle, setInnerText } from "./utils";

window.addEventListener("DOMContentLoaded", function () {
  var mainHeader = query("#main-header");
  var orderConfirmed = query(".os-step__title");
  var orderConfirmedDescription = query(".os-step__description");
  var continueButton = query(".step__footer__continue-btn");
  var checkMarkIcon = query(".os-header__hanging-icon");
  var script = query("#mixpay-shopify");

  document.title = document.title.replace("Thank you", "Review and pay");
  setInnerText(mainHeader, "Review and pay!");
  setStyle(orderConfirmed, "visibility", "hidden");
  setStyle(orderConfirmedDescription, "display", "block");
  setStyle(continueButton, "visibility", "hidden");
  setStyle(checkMarkIcon, "visibility", "hidden");

  var prefix, apiKey;
  if (script) {
    prefix = script.getAttribute("src").split("/shopify/shopify.js")[0];
    apiKey = script.getAttribute("data-api");
  } else {
    prefix = "https://pluginsapi.mixpay.me/plugins";
    apiKey = "372fdba9-fdee-4b4c-b4d9-9aa915b4910c";
  }

  var match = prefix.match(/(https?)\:\/\/.*?(?=\/|$)/);
  var apiDomainUrl = match && match[0];

  var button = createEle("button", { style: "outline:none" });
  var img = createEle("img", { src: prefix + "/shopify/button.png" });
  var link = createEle("link", {
    rel: "stylesheet",
    href: prefix + "/shopify/shopify.css",
  });
  document.head.appendChild(link);
  button.appendChild(img);

  function pageSuccess() {
    document.title = document.title.replace("Review and pay", "Thank you");
    setInnerText(mainHeader, "Thank you!");
    setStyle(orderConfirmed, "visibility", "visible");
    setStyle(orderConfirmedDescription, "display", "none");
    setStyle(continueButton, "visibility", "visible");
    setStyle(checkMarkIcon, "visibility", "visible");
    setStyle(button, "display", "none");
  }

  function pageInvalid() {
    setInnerText(mainHeader, "Thank you!");
    setInnerText(orderConfirmed, "Your order is closed!");
    setStyle(orderConfirmed, "visibility", "visible");
    setStyle(continueButton, "visibility", "visible");
  }

  function pageError() {
    setInnerText(orderConfirmed, "Network Error, please refresh this page.");
    setStyle(orderConfirmed, "visibility", "visible");
    setStyle(orderConfirmed, "color", "red");
  }

  APIS._getOrderDetail(apiDomainUrl, apiKey, window.Shopify.checkout.order_id)
    .then((data) => {
      const d = data.data;
      if (d.status == "unpaid") {
        orderConfirmed.after(button);
        new ShopifyModal({
          toggler: button,
          quoteAmount: window.Shopify.checkout.total_price,
          quoteAssetId: window.Shopify.checkout.currency.toLowerCase(),
          orderId: window.Shopify.checkout.order_id,
          apiKey: apiKey,
          apiDomainUrl: apiDomainUrl,
          onSuccess: pageSuccess,
          shopName: d.merch_name,
        });
      }

      if (d.status == "paid") {
        pageSuccess();
      }
      if (d.status == "invalid") {
        pageInvalid();
      }
    })
    .catch((err) => {
      console.error(err);
      pageError();
    });
});
