(function() {
  const _ = {}

  /*
  Isometric 
*/

  _.toIsometric = function (_x,_y,_z) {
    return {
      x: (_x - _y) * 0.866025,
      y: _z + (_x + _y) * 0.5
    }
  }

  /*
    String function
  */

  //String template function 
  _.template = function(strings, ...keys) {
    return [keys, (...values)=>{
      const dict = values[values.length - 1] || {};
      const result = [strings[0]];
      keys.forEach((key,i)=>{
        const value = Number.isInteger(key) ? values[key] : dict[key];
        result.push(value, strings[i + 1]);
      }
      );
      return result.join("");
    }
    ]
  }

  //convert str to HTML 
  _.wrapToHTML = function(str, data) {
    let _str = typeof str === "function" ? str(data) : str
    return new Function(`return _.html\`${_str}\`;`)()
  }

  //apply a template 
  _.applyTempate = function(str, data) {
    let pullKeys = /(?<={).*?(?=})/g
    let keys = str.match(pullKeys) || []
    let vals = keys.map(k=>_.deepGet(data, k))
    //replace dot with _ 
    keys = keys.map(k=>k.replace(".", "_"))

    //apply html wrapping 
    let res = new Function(...keys,`return _.html\`${str}\`;`)(...vals)
    return res
  }

  // capitalizes first character of a string
  _.capitalize = function(str) {
    if (this) {
      return str.substr(0, 1).toUpperCase() + str.substr(1);
    } else {
      return '';
    }
  }
  ;

  //Simple roman numeral conversion 
  _.romanNumeral = function(n) {
    var units = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];

    if (n < 0 || n >= 20) {
      return n;
    } else if (n >= 10) {
      return "X" + this.romanNumeral(n - 10);
    } else {
      return units[n];
    }
  }

  //Simple roman numeral conversion 
  _.suffix = function(_n) {
    let n = _n % 10

    if (_n <= 0) {
      return n;
    } else if (_n > 3 && _n < 20) {
      return _n + 'th';
    } else {
      return _n + ['st', 'nd', 'rd'][n - 1];
    }
  }

  /*
  Array mixins 
*/
  // functional sum
  _.sum = function(arr) {
    return arr.reduce((s,v)=>s += v, 0);
  }

  //build array from umber from 
  _.fromN = function(n, f) {
    return Array.from({
      length: n
    }, (v,i)=>f(i));
  }

  // standard clamp function -- clamps a value into a range
  _.clamp = function(a, min, max) {
    return a < min ? min : (a > max ? max : a);
  }
  ;

  // linear interpolation from a to b by parameter t
  _.lerp = function(a, b, t) {
    return a * (1 - t) + b * t;
  }
  ;

  /*
    Object helpers
  */
  _.fromEntries = function (arr) {
    return Object.fromEntries(arr)
  }

  /*
    https://gist.github.com/andrewchilds/30a7fb18981d413260c7a36428ed13da
     Simple implementation of lodash.get
     Handles arrays, objects, and any nested combination of the two.
     Based on: https://gist.github.com/harish2704/d0ee530e6ee75bad6fd30c98e5ad9dab
     Also handles undefined as a valid value - see test case for details.
  */
  _.deepGet = function(obj, query, defaultVal) {
    query = Array.isArray(query) ? query : query.replace(/(\[(\d)\])/g, '.$2').replace(/^\./, '').split('.');
    if (!(query[0]in obj)) {
      return defaultVal;
    }
    obj = obj[query[0]];
    if (obj && query.length > 1) {
      return _.deepGet(obj, query.slice(1), defaultVal);
    }
    return obj;
  }

  // If there is a window object, that at least has a document property,
  // instantiate and define chance on the window
  if (typeof window === "object" && typeof window.document === "object") {
    window._ = _;
  }
}
)();
