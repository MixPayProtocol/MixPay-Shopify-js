function copyText(str) {
  const e = document.createElement("textarea");
  e.value = str;
  e.setAttribute("readonly", "");
  e.style.cssText = "position:absolute;left:-9999px";
  document.body.appendChild(e);
  if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
    const n = document.createRange();
    n.selectNodeContents(e);
    const r = window.getSelection();
    r.removeAllRanges();
    r.addRange(n);
    e.setSelectionRange(0, 999999);
  } else {
    e.select();
  }

  try {
    document.execCommand("copy");
    e.remove();
  } catch (t) {
    e.remove();
    return false;
  }
  return true;
}


export function addCopyEvent(element) {
  if (!element) return;
  element.onclick = function () {
    clearTimeout(this.copyTimeout);
    const selector = this.dataset.target;
    const target = element.querySelector('.' + selector);
    if (!target) return;
    const selectContent = target.innerText;
    if (copyText(selectContent)) {
      this.classList.add('copy-success');
      this.copyTimeout = setTimeout(() => {
        this.classList.remove("copy-success");
      }, 3000);
    }
  };
}

export function query(selector) {
  return document.querySelector(selector);
}

export function queryAll(selector) {
  return document.querySelectorAll(selector);
}

export function createEle(tag, attributes) {
  var e = document.createElement(tag);
  for (var key in attributes) {
    e.setAttribute(key, attributes[key]);
  }
  return e;
}

export function setStyle(element, key, value) {
  element && (element.style[key] = value);
}

export function setInnerText(element, text) {
  element && (element.innerText = text);
}

export function addEvents() {

}

export const namespace = '__mixpay'
