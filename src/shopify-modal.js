import { v4 as uuidv4 } from "uuid";
import render from "./render";
import APIS from "./api";
import "./shopify-modal.scss";

function ShopifyModal(options = {}) {
  this.apiKey = options.apiKey;
  this.orderId = options.orderId;
  this.apiDomainUrl = options.apiDomainUrl;
  this.onSuccess = options.onSuccess || function () {};
  this.quoteAssetId = options.quoteAssetId;
  this.quoteAmount = options.quoteAmount;
  this.toggler = options.toggler;
  this.shopName = options.shopName;
  this.clientId = uuidv4();

  this.paymentMethod = "mixin";
  this.paymentAssetId = null;
  this.payments = {};
  this.result = {};
  this.paymentAssets = [];
  this.quoteAssets = [];

  this.isReady = false;
  this.isShow = false;
  this.isPaymentCreating = false;
  this.isConfirmed = false;

  this.countdownKey = null;
  this.pollKey = null;

  this.init();

  if (this.toggler instanceof HTMLElement) {
    var that = this;
    this.toggler.onclick = function () {
      that.toggleShow();
    };
  }
}

ShopifyModal.prototype = {
  init() {
    this.render();
    this.load();
  },

  load() {
    const promises = [];
    if (!this.quoteAssets.length) {
      promises.push(this._getQuoteAssets());
    }
    if (!this.paymentAssets.length) {
      promises.push(this._getPaymentAssets());
    }

    Promise.all(promises)
      .then(() => {
        this.isReady = true;
        this.toggleLoading();
        if (!this.paymentAssetId) {
          if (
            this.paymentAssets.find(
              (item) => item.assetId === "c6d0c728-2624-429b-8e0d-d9d19b6592fa"
            )
          ) {
            this.paymentAssetId = "c6d0c728-2624-429b-8e0d-d9d19b6592fa";
          } else {
            this.paymentAssetId = this.quoteAssets[0].assetId;
          }
        }
        this.renderOrder();
        this.changeStep(0);
      })
      .catch((e) => {
        console.error(e);
        setTimeout(() => this.load(), 2000);
      });
  },

  getEstPaymentAmount() {
    return this._getEstAmount(
      this.paymentAssetId,
      this.paymentAssetId,
      this.quoteAmount,
      this.quoteAssetId
    ).then((data) => {
      return Promise.resolve(data.data.paymentAmount);
    });
  },

  createPayment() {
    return this._createPayment({
      api_symbol: this.apiKey,
      merch_order_id: this.orderId,
      pay_asset_uuid: this.paymentAssetId,
      is_chain: this.paymentMethod === "chain",
      client_id: this.clientId,
    }).then((data) => {
      const d = data.data;
      this.payments = {
        isChain: d.isChain,
        clientId: d.clientId,
        traceId: d.traceId,
        destination: d.destination,
        tag: d.tag,
        expire: d.expire,
        paymentAmount: d.paymentAmount,
        paymentAssetId: d.paymentAssetId,
        recipient: d.recipient,
        memo: d.memo,
      };
      const payment = this.paymentAssets.find(
        (item) => item.assetId === d.paymentAssetId
      );
      const quote = this.quoteAssets.find(
        (item) => item.assetId == this.quoteAssetId
      );
      this.result = {
        status: "unpaid",
        paymentAmount: d.paymentAmount,
        paymentAssetSymbol: payment && payment.symbol,
        quoteAmount: this.quoteAmount,
        quoteAssetSymbol: quote && quote.symbol,
        txid: "",
        date: "",
      };

      this.startCountdown();
      this.queryOrder();
    });
  },

  startCountdown() {
    clearInterval(this.countdownKey);
    const { isChain, expire } = this.payments;
    const countdown = () => {
      const diff = expire - Math.ceil(new Date().getTime() / 1000);
      if (diff >= 0) {
        this.setCountdown(isChain, diff);
      } else {
        clearInterval(this.countdownKey);
        clearInterval(this.pollKey);
        this.renderResult();
        this.changeStep(2);
      }
    };
    this.countdownKey = setInterval(() => countdown(), 1000);
    countdown();
  },

  queryOrder() {
    clearInterval(this.pollKey);
    this.pollKey = setInterval(() => {
      this._getPaymentResult(this.payments.clientId, this.payments.traceId)
        .then((data) => {
          const d = data.data;
          const isStatusChange = d.status !== this.result.status;
          this.result.status = d.status;
          this.result.paymentAmount = d.paymentAmount;
          this.result.paymentAssetSymbol = d.paymentSymbol;
          this.result.quoteAmount = d.quoteAmount;
          this.result.quoteAssetSymbol = d.quoteSymbol;
          this.result.txid = d.txid;
          this.result.date = new Date(d.date * 1000).toLocaleString();

          if (d.status === "success") {
            clearInterval(this.pollKey);
            clearInterval(this.countdownKey);
            if (typeof this.onSuccess === "function") {
              this.onSuccess();
            }
          }
          if (d.status === "failed") {
            clearInterval(this.pollKey);
            clearInterval(this.countdownKey);
          }

          if (isStatusChange) {
            this.renderResult();
            this.changeStep(2);
          }
        })
        .catch(() => {});
    }, 3000);
  },
};

Object.assign(ShopifyModal.prototype, render, APIS);

export default ShopifyModal;
