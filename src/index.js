(function () {
  function query(selector) {
    return document.querySelector(selector);
  }

  function createEle(tag, attributes) {
    var e = document.createElement(tag);
    for (var key in attributes) {
      e.setAttribute(key, attributes[key]);
    }
    return e;
  }

  function setStyle(element, key, value) {
    element && (element.style[key] = value);
  }

  function setInnerText(element, text) {
    element && (element.innerText = text);
  }

  function ajax(method, url, data = "") {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

      xhr.ontimeout = function () {
        reject(new Error("Request timeout, please try it again later."));
      };

      xhr.onerror = function (e) {
        reject(e);
      };

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              resolve(xhr.responseText);
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(error);
            } catch (e) {
              reject(new Error(xhr.responseText));
            }
          }
        }
      };

      xhr.send(JSON.stringify(data));
    });
  }

  function init() {
    var mainHeader = query("#main-header");
    var orderConfirmed = query(".os-step__title");
    var orderConfirmedDescription = query(".os-step__description");
    var continueButton = query(".step__footer__continue-btn");
    var checkMarkIcon = query(".os-header__hanging-icon");
    var script = query("#mixpay-shopify");

    document.title = document.title.replace("Thank you", "Review and pay");
    setInnerText(mainHeader, "Review and pay!");
    setStyle(mainHeader, "visibility", "visible");
    setStyle(orderConfirmed, "visibility", "hidden");
    setStyle(orderConfirmedDescription, "display", "block");
    setStyle(continueButton, "visibility", "hidden");
    setStyle(checkMarkIcon, "visibility", "hidden");

    var prefix, apiKey;
    if (script) {
      prefix = script.getAttribute("src").split("/shopify/shopify.js")[0];
      apiKey = script.getAttribute("data-api");
    } else if (process.env.NODE_ENV == "development") {
      prefix = "https://mixpay-plugins.thorb.com/plugins";
      apiKey = "79c49b0a-fc3c-4779-836b-fe50ecbf75cb";
    }

    var match = prefix.match(/(https?)\:\/\/.*?(?=\/|$)/);
    var apiDomainUrl = (match && match[0]) || "https://pluginsapi.mixpay.me";
    var orderId = window.Shopify.checkout.order_id;

    var button = createEle("a", {
      href: "",
      target: "_self",
    });
    var img = createEle("img", {
      style: "max-height:60px",
      src: prefix + "/shopify/button.png?t=" + Date.now(),
    });

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

    ajax(
      "get",
      `${apiDomainUrl}/v1/orders/merch_order?api_symbol=${apiKey}&merch_order_id=${orderId}`
    )
      .then((data) => {
        if (!data.data.is_mixpay) {
          pageSuccess();
          return;
        }
        if (data.data.status === "unpaid") {
          return ajax("post", `${apiDomainUrl}/v1/one_time_payment`, {
            api_symbol: apiKey,
            merch_order_id: orderId,
            return_to: window.location.href,
          }).then((data) => {
            button.setAttribute("href", data.data.url);
            orderConfirmed.after(button);
          });
        }

        if (data.data.status == "paid") {
          pageSuccess();
        }
        if (data.data.status == "invalid") {
          pageInvalid();
        }
      })
      .catch((err) => {
        console.error(err);
        pageError();
      });
  }

  window.addEventListener("DOMContentLoaded", init);
})();
