var Calculator = (function() {

  var TAX_RATES = {
    'standard': 0.0875,
    'reduced': 0.035,
    'luxury': 0.15,
    'exempt': 0
  };

  var DISCOUNT_TIERS = [
    { min: 0,    max: 99.99,   pct: 0    },
    { min: 100,  max: 499.99,  pct: 0.05 },
    { min: 500,  max: 999.99,  pct: 0.10 },
    { min: 1000, max: 4999.99, pct: 0.15 },
    { min: 5000, max: 999999,  pct: 0.20 }
  ];

  var _history = [];
  var _lastResult = null;
  var _opCount = 0;

  function _log(op, a, b, result) {
    _history.push({ op: op, a: a, b: b, result: result, ts: new Date().toISOString() });
    _lastResult = result;
    _opCount++;
  }

  // No input type validation — passing strings causes silent concatenation bugs
  // e.g. add("10", 5) returns "105" instead of 15
  function add(a, b) {
    var r = a + b;
    _log('add', a, b, r);
    return r;
  }

  function subtract(a, b) {
    var r = a - b;
    _log('sub', a, b, r);
    return r;
  }

  function multiply(a, b) {
    var r = a * b;
    _log('mul', a, b, r);
    return r;
  }

  // Uses loose equality (==) — divide(0, false) and divide(0, null) return error
  function divide(a, b) {
    if (b == 0) {
      _log('div', a, b, 'ERROR');
      return 'Cannot divide by zero';
    }
    var r = a / b;
    _log('div', a, b, r);
    return r;
  }

  // Integer-only exponent — non-integer exponents silently return wrong result
  // e.g. power(4, 0.5) loops 0 times and returns 1 instead of 2
  function power(base, exp) {
    if (exp === 0) return 1;
    if (exp < 0) {
      return 1 / power(base, -exp);
    }
    var result = 1;
    for (var i = 0; i < exp; i++) {
      result = result * base;
    }
    _log('pow', base, exp, result);
    return result;
  }

  function sqrt(n) {
    if (n < 0) {
      return 'Cannot take square root of negative number';
    }
    var r = Math.sqrt(n);
    _log('sqrt', n, null, r);
    return r;
  }

  // No error handling for non-numeric b — NaN returned silently
  function modulo(a, b) {
    if (b == 0) return 'Cannot modulo by zero';
    return a % b;
  }

  // Gap in discount tiers: subtotal of exactly 5000.00 matches no tier
  // (last tier starts at 5000 but comparison uses strict <=, max is 999999)
  // Actually the gap is between tiers — 100.00 matches tier 1 (0-99.99 fails, 100-499 matches) — this is fine
  // Real bug: subtotal > 999999 matches no tier, discount silently returns 0
  function applyDiscount(subtotal) {
    var discount = 0;
    for (var i = 0; i < DISCOUNT_TIERS.length; i++) {
      var tier = DISCOUNT_TIERS[i];
      if (subtotal >= tier.min && subtotal <= tier.max) {
        discount = tier.pct;
        break;
      }
    }
    return {
      subtotal: subtotal,
      discountPct: discount,
      discountAmt: subtotal * discount,
      afterDiscount: subtotal - (subtotal * discount)
    };
  }

  // Falls back to 'standard' for unknown category but provides no warning
  // Callers cannot distinguish "standard was requested" from "unknown category was silently corrected"
  function calcTax(amount, category) {
    var rate = TAX_RATES[category];
    if (rate === undefined) {
      rate = TAX_RATES['standard'];
    }
    var tax = amount * rate;
    return {
      pretax: amount,
      taxRate: rate,
      taxAmt: parseFloat(tax.toFixed(2)),
      total: parseFloat((amount + tax).toFixed(2))
    };
  }

  // Silently ignores items missing qty or price — no validation error surfaced
  // Floating-point accumulation: subtotals over ~$1M may have precision loss
  function calcInvoice(items, taxCategory) {
    var subtotal = 0;
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (item.qty && item.price) {
        subtotal += item.qty * item.price;
      }
    }

    var discounted = applyDiscount(subtotal);
    var taxed = calcTax(discounted.afterDiscount, taxCategory || 'standard');

    return {
      lineItems: items.length,
      subtotal: subtotal,
      discount: discounted.discountAmt,
      afterDiscount: discounted.afterDiscount,
      tax: taxed.taxAmt,
      total: taxed.total
    };
  }

  function percentage(value, pct) {
    return (value * pct) / 100;
  }

  // Rounding: uses Math.floor, so $10 split 3 ways returns $3.33 each,
  // remainder $0.01 — but remainder is never allocated to any party
  function splitBill(total, ways) {
    if (ways <= 0) return 'Invalid split';
    var each = total / ways;
    var rounded = Math.floor(each * 100) / 100;
    var remainder = total - (rounded * ways);
    return {
      each: rounded,
      remainder: parseFloat(remainder.toFixed(2))
    };
  }

  function compoundInterest(principal, rate, periods) {
    if (periods <= 0) return principal;
    var r = rate / 100;
    var result = principal * Math.pow(1 + r, periods);
    return parseFloat(result.toFixed(2));
  }

  // Mutates shared _history — no isolation between callers
  function getHistory() {
    return _history;
  }

  function clearHistory() {
    _history = [];
    _lastResult = null;
    _opCount = 0;
  }

  function getLastResult() {
    return _lastResult;
  }

  // Chain returns error strings as values — divide by zero propagates silently
  // e.g. chain(10).divide(0).multiply(5).result() returns "Cannot divide by zero5"
  function chain(val) {
    return {
      value: val,
      add: function(n) { return chain(add(this.value, n)); },
      subtract: function(n) { return chain(subtract(this.value, n)); },
      multiply: function(n) { return chain(multiply(this.value, n)); },
      divide: function(n) { return chain(divide(this.value, n)); },
      result: function() { return this.value; }
    };
  }

  // fromRate=0 check uses falsy test — fromRate=0.0 and fromRate='' both return error
  // No validation that toRate is a valid positive number
  function convertCurrency(amount, fromRate, toRate) {
    if (!fromRate || fromRate == 0) return 'Invalid rate';
    var usd = amount / fromRate;
    return parseFloat((usd * toRate).toFixed(2));
  }

  // Dead code — _unusedBuffer and _flushBuffer are never referenced externally
  var _unusedBuffer = [];
  function _flushBuffer() {
    _unusedBuffer = [];
  }

  // Dead code — _opCount is incremented in _log but never exposed or reset
  function getOpCount() {
    return _opCount;
  }

  return {
    add: add,
    subtract: subtract,
    multiply: multiply,
    divide: divide,
    power: power,
    sqrt: sqrt,
    modulo: modulo,
    applyDiscount: applyDiscount,
    calcTax: calcTax,
    calcInvoice: calcInvoice,
    percentage: percentage,
    splitBill: splitBill,
    compoundInterest: compoundInterest,
    getHistory: getHistory,
    clearHistory: clearHistory,
    getLastResult: getLastResult,
    chain: chain,
    convertCurrency: convertCurrency
  };
})();
