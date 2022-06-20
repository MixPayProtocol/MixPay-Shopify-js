import Qrious from "qrious";
import TEMPLATE from "./template";
import { namespace, addCopyEvent, setInnerText } from "./utils";

const ua = navigator.userAgent.toLowerCase();
const isMobile =
  ua.indexOf("android") > -1 ||
  ua.indexOf("adr") > -1 ||
  !!ua.match(/\(i[^;]+;( u;)? cpu.+mac os x/);

function query(element, selector) {
  return element.querySelector(selector);
}

function queryAll(element, selector) {
  return element.querySelectorAll(selector);
}

function addEvent(element, handler) {
  element.onclick = handler;
}

function addEvents(elements, handler) {
  [].forEach.call(elements, (ele) => {
    ele.onclick = handler;
  });
}

export default {
  render() {
    const element = document.createElement("div");
    element.setAttribute("class", namespace);
    element.style.display = "none";

    const mask = document.createElement("div");
    mask.setAttribute("class", namespace + "-mask");

    const container = document.createElement("div");
    container.setAttribute("class", namespace + "-container");

    container.innerHTML = TEMPLATE;

    const title = query(container, `.${namespace}-header__title`);
    setInnerText(title, "Pay to " + this.shopName);

    element.appendChild(mask);
    element.appendChild(container);

    document.body.appendChild(element);

    this.element = element;
    this.countdownMixin = query(
      element,
      `.${namespace}-checkout[data-id=mixin] .${namespace}-checkout-header__countdown`
    );
    this.countdownChain = query(
      element,
      `.${namespace}-checkout[data-id=chain] .${namespace}-checkout-header__countdown`
    );

    this.addEvent();
  },

  addEvent() {
    const element = this.element;
    const that = this;

    const copyEles = queryAll(element, ".copy-toggler");
    [].forEach.call(copyEles, (ele) => {
      addCopyEvent(ele);
    });

    const selector = query(element, `.${namespace}-selector-control`);
    const list = query(element, `.${namespace}-selector-list`);

    addEvent(selector, function () {
      if (list.classList.contains("show")) {
        list.classList.remove("show");
      } else {
        list.classList.add("show");
      }
    });

    addEvent(list, function (e) {
      let target = e.target || e.srcElement;
      if (target === this) return;
      while (String(target.tagName).toUpperCase() !== "LI") {
        target = target.parentNode;
      }
      this.classList.remove("show");
      that.setPaymentAsset(target.dataset.value);
    });

    const checkItems = queryAll(element, `.${namespace}-check-item`);

    addEvents(checkItems, function () {
      that.setPaymentMethod(this.dataset.value);
    });

    const closeBtn = query(element, `.${namespace}-header__action`);
    closeBtn.onclick = function () {
      that.hide();
    };

    const payBtn = query(element, `.${namespace}-order button`);
    const payError = query(element, `.${namespace}-order-error`);

    payBtn.onclick = function () {
      if (that.isPaymentCreating) return;
      that.isPaymentCreating = true;
      this.classList.add("inactive");
      payError.innerHTML = '';
      that
        .createPayment()
        .then(() => {
          that.isPaymentCreating = false;
          that.renderCheckout();
          that.changeStep(1);
          this.classList.remove("inactive");
        })
        .catch((err) => {
          payError.innerHTML = '<span>' + err.message + '</span>';
          that.isPaymentCreating = false;
          this.classList.remove("inactive");
        });
    };

    const mixinPayBtn = queryAll(
      element,
      `.${namespace}-checkout[data-id=mixin] button`
    )[0];
    const mixinBackBtn = queryAll(
      element,
      `.${namespace}-checkout[data-id=mixin] button`
    )[1];

    mixinPayBtn.onclick = function () {
      const { recipient, paymentAssetId, paymentAmount, traceId, memo } =
        that.payments;
      window.location.href = `mixin://pay?recipient=${recipient}&asset=${paymentAssetId}&amount=${paymentAmount}&trace=${traceId}&memo=${memo}`;
    };

    mixinBackBtn.onclick = function () {
      clearInterval(that.countdownKey);
      clearInterval(that.pollKey);
      that.renderOrder();
      that.changeStep(0);
    };

    const chainBtns = queryAll(
      element,
      `.${namespace}-checkout[data-id=chain] button`
    );

    chainBtns[0].onclick = function () {
      clearInterval(that.countdownKey);
      that.isConfirmed = true;
      that.renderResult();
      that.changeStep(2);
    };

    chainBtns[1].onclick = function () {
      clearInterval(that.countdownKey);
      clearInterval(that.pollKey);
      that.renderOrder();
      that.changeStep(0);
    };

    const pendingBackBtn = query(
      element,
      `.${namespace}-result[data-id=pending] button`
    );
    pendingBackBtn.onclick = function () {
      const { expire } = that.payments;
      if (new Date().getTime() >= expire * 1000) {
        clearInterval(that.pollKey);
        that.isConfirmed = false;
        that.renderResult();
      } else {
        that.isConfirmed = false;
        that.startCountdown();
        that.renderCheckout();
        that.changeStep(1);
      }
    };

    const successBtn = query(
      element,
      `.${namespace}-result[data-id=success] button`
    );
    successBtn.onclick = function () {
      that.hide();
    };

    const failedBtn = query(
      element,
      `.${namespace}-result[data-id=failed] button`
    );
    failedBtn.onclick = function () {
      that.renderOrder();
      that.changeStep(0);
    };

    const refreshBtn = query(
      element,
      `.${namespace}-result[data-id=overtime] button`
    );
    const refreshError = query(element, `.${namespace}-result[data-id=overtime] .${namespace}-result-error`);
    refreshBtn.onclick = function () {
      if (that.isPaymentCreating) return;
      that.isPaymentCreating = true;
      this.classList.add("inactive");
      refreshError.innerHTML = '';
      that
        .createPayment()
        .then(() => {
          that.isPaymentCreating = false;
          that.renderCheckout();
          that.changeStep(1);
          this.classList.remove("inactive");
        })
        .catch((err) => {
          console.error(err);
          refreshError.innerHTML = '<span>' + err.message +'</span>';
          that.isPaymentCreating = false;
          this.classList.remove("inactive");
        });
    };
  },

  changeStep(stepIndex) {
    const steps = queryAll(this.element, `.${namespace}-step`);
    [].forEach.call(steps, (step, index) => {
      if (stepIndex == index) {
        step.style.display = "block";
      } else {
        step.style.display = "none";
      }
    });
  },

  renderOrder() {
    const element = this.element;
    const orderAmount = query(element, `.${namespace}-order-header__amount`);
    const list = query(element, `.${namespace}-selector-list`);
    const quoteAsset = this.quoteAssets.find(
      (item) => item.assetId === this.quoteAssetId
    );
    orderAmount.innerHTML = `${this.quoteAmount} ${
      quoteAsset && quoteAsset.symbol
    }`;
    list.innerHTML = this.paymentAssets
      .map(
        (item) =>
          `<li data-value="${item.assetId}"><img src="${item.iconUrl}"/><span>${item.symbol}</span><em>${item.network}</em></li>`
      )
      .join("");
    this.setPaymentAsset(this.paymentAssetId, true);
    this.setPaymentMethod(this.paymentMethod, true);
  },
  renderCheckout() {
    const wrapperMixin = query(
      this.element,
      `.${namespace}-checkout[data-id=mixin]`
    );
    const wrapperChain = query(
      this.element,
      `.${namespace}-checkout[data-id=chain]`
    );
    const asset = this.paymentAssets.find(
      (item) => item.assetId === this.payments.paymentAssetId
    );

    if (this.payments.isChain) {
      wrapperMixin.style.display = "none";
      wrapperChain.style.display = "block";

      const amount = query(
        wrapperChain,
        `.${namespace}-checkout-header__amount-content`
      );
      const network = queryAll(
        wrapperChain,
        `.${namespace}-qrious-info__content`
      )[0];
      const address = query(
        wrapperChain,
        `.${namespace}-qrious-info__content .copy-content`
      );
      const canvas = query(wrapperChain, "canvas");
      const tipContent = query(wrapperChain, `.${namespace}-tip__content`);

      amount.innerHTML = `<img src="${asset.iconUrl}" alt="${asset.symbol}" /><span class="copy-content">${this.payments.paymentAmount}</span><span>${asset.symbol}</span>`;
      network.innerText = asset.network;
      address.innerText = this.payments.destination;
      new Qrious({
        element: canvas,
        value: this.payments.destination,
        level: "H",
        size: 400,
      });
      tipContent.innerHTML = `<p>1. Do not transfer any non-${asset.symbol} assets to the above address.</p><p>2. Please confirm your transfer network is "${asset.network}", or you may lose your assets.</p>`;
    } else {
      wrapperChain.style.display = "none";
      wrapperMixin.style.display = "block";

      const amount = query(
        wrapperMixin,
        `.${namespace}-checkout-header__amount-content`
      );
      const canvas = query(wrapperMixin, "canvas");
      amount.innerHTML = `<img src="${asset.iconUrl}" alt="${asset.symbol}" /><span class="copy-content">${this.payments.paymentAmount}</span><span>${asset.symbol}</span>`;

      new Qrious({
        element: canvas,
        value: `mixin://pay?recipient=${this.payments.recipient}&asset=${this.payments.paymentAssetId}&amount=${this.payments.paymentAmount}&trace=${this.payments.traceId}&memo=${this.payments.memo}`,
        level: "H",
        size: 600,
      });

      const payBtn = query(wrapperMixin, 'button');
      if (isMobile) {
        payBtn.style.display = 'block';
      } else {
        payBtn.style.display = 'none';
      }
    }
  },

  renderResult() {
    const {
      status,
      paymentAmount,
      paymentAssetSymbol,
      quoteAmount,
      quoteAssetSymbol,
      txid,
      date,
    } = this.result;
    const isConfirmed = this.isConfirmed;
    const results = queryAll(this.element, `.${namespace}-result`);
    let activeIndex = -1;
    if ((status === "unpaid" && isConfirmed) || status === "pending") {
      activeIndex = 0;
      const paymentEl = query(
        results[0],
        `.${namespace}-result-header__payment`
      );
      const quoteEl = query(results[0], `.${namespace}-result-header__quote`);
      const backBtn = query(results[0], "button");

      paymentEl.innerText = `${paymentAmount} ${paymentAssetSymbol}`;
      quoteEl.innerText = `${quoteAmount} ${quoteAssetSymbol}`;

      if (status === "pending") {
        backBtn.style.display = "none";
      } else {
        backBtn.style.display = "block";
      }
    }

    if (status === "success") {
      activeIndex = 1;
      const paymentEl = query(
        results[1],
        `.${namespace}-result-header__payment`
      );
      const quoteEl = query(results[1], `.${namespace}-result-header__quote`);
      const txidEl = queryAll(
        results[1],
        `.${namespace}-result-detail__content`
      )[0];
      const dateEl = queryAll(
        results[1],
        `.${namespace}-result-detail__content`
      )[1];

      paymentEl.innerText = `${paymentAmount} ${paymentAssetSymbol}`;
      quoteEl.innerText = `${quoteAmount} ${quoteAssetSymbol}`;
      txidEl.innerHTML = txid
        ? `<span class="copy-content">${txid}</span><svg class="icon-copy"><use xlink:href="#mixpayModalCopy" /></svg>`
        : "-";
      dateEl.innerText = date ? date : "-";
    }

    if (status === "failed") {
      activeIndex = 2;
    }

    if (
      status === "unpaid" &&
      !isConfirmed &&
      new Date().getTime() >= this.payments.expire * 1000
    ) {
      activeIndex = 3;
    }

    [].forEach.call(results, (result, index) => {
      if (index == activeIndex) {
        result.style.display = "block";
      } else {
        result.style.display = "none";
      }
    });
  },

  setPaymentAsset(value, force = false) {
    if (this.paymentAssetId === value && !force) return;
    const asset = this.paymentAssets.find((item) => item.assetId === value);
    if (!asset) return;
    this.paymentAssetId = value;
    const selected = query(
      this.element,
      `.${namespace}-selector-control .selected`
    );
    selected.innerHTML = `<img src="${asset.iconUrl}" /><span>${asset.symbol}</span><em>${asset.network}</em>`;
    this.getEstPaymentAmount()
      .then((amount) => {
        this.setEstPaymentAmount(amount, asset.symbol);
      })
      .catch(() => {
        this.setEstPaymentAmount("...", "");
      });
  },

  setEstPaymentAmount(amount, symbol) {
    const est = query(this.element, `.${namespace}-selector-footer`);
    est.innerHTML = `You will pay: ${amount} ${symbol}`;
  },

  setPaymentMethod(method, force = false) {
    if (this.paymentMethod === method && !force) return;
    const checkItems = queryAll(this.element, `.${namespace}-check-item`);
    [].forEach.call(checkItems, function (item) {
      if (item.dataset.value === method) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
    this.paymentMethod = method;
  },

  setCountdown(isChain, countdownNum) {
    if (isChain) {
      this.countdownChain.innerHTML = `Please complete the transfer within <strong>${countdownNum}s</strong>`;
    } else {
      this.countdownMixin.innerHTML = `Please complete the transfer within <strong>${countdownNum}s</strong>`;
    }
  },

  toggleLoading() {
    const loading = query(this.element, `.${namespace}-spinner`);
    if (this.isReady) {
      loading.style.display = "none";
    } else {
      loading.style.display = "block";
    }
  },

  toggleShow() {
    if (this.isShow) {
      this.hide();
    } else {
      this.show();
    }
  },

  show() {
    this.isShow = true;
    this.element.style.display = "block";
  },
  hide() {
    this.isShow = false;
    this.element.style.display = "none";
  },
};
