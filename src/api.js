const ajax = {
  get(url) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);

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

      xhr.send();
    });
  },
  post(url, data) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);
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
  },
};

export default {
  _getQuoteAssets() {
    return ajax
      .get("https://api.mixpay.me/v1/setting/quote_assets")
      .then((data) => {
        this.quoteAssets = Array.isArray(data.data) ? data.data : [];
      });
  },
  _getPaymentAssets() {
    return ajax
      .get("https://api.mixpay.me/v1/setting/payment_assets")
      .then((data) => {
        this.paymentAssets = Array.isArray(data.data) ? data.data : [];
      });
  },
  _getEstAmount(paymentAssetId, settlementAssetId, quoteAmount, quoteAssetId) {
    return ajax.get(
      `https://api.mixpay.me/v1/payments_estimated?paymentAssetId=${paymentAssetId}&settlementAssetId=${settlementAssetId}&quoteAmount=${quoteAmount}&quoteAssetId=${quoteAssetId}`
    );
  },
  _createPayment(data) {
    return ajax.post(`${this.apiDomainUrl}/v1/orders`, data);
  },
  _getPaymentResult(clientId, traceId) {
    return ajax.get(
      `${this.apiDomainUrl}/v1/orders/status?client_id=${clientId}&trace_id=${traceId}`
    );
  },
  _getOrderDetail(url, apiSymbol, orderId) {
    return ajax.get(`${url}/v1/orders/merch_order?api_symbol=${apiSymbol}&merch_order_id=${orderId}`);
  }
};
