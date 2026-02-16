// from https://github.com/jashkenas/underscore/blob/master/modules/template.js

const escapeMap: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};

const ESCAPE_REGEX = /[&<>"]/g;

const _ = {
  escape(s: string) {
    return s.replace(ESCAPE_REGEX, (match) => escapeMap[match]);
  },
};

// When customizing `_.templateSettings`, if you don't want to define an
// interpolation, evaluation or escaping regex, we need one that is
// guaranteed not to match.
var noMatch = /(.)^/;

// Certain characters need to be escaped so that they can be put into a
// string literal.
var escapes: Record<string, string> = {
  "'": "'",
  "\\": "\\",
  "\r": "r",
  "\n": "n",
  "\u2028": "u2028",
  "\u2029": "u2029",
};

var escapeRegExp = /\\|'|\r|\n|\u2028|\u2029/g;

function escapeChar(match: string) {
  return "\\" + escapes[match];
}

// In order to prevent third-party code injection through
// `_.templateSettings.variable`, we test it against the following regular
// expression. It is intentionally a bit more liberal than just matching valid
// identifiers, but still prevents possible loopholes through defaults or
// destructuring assignment.
var bareIdentifier = /^\s*(\w|\$)+\s*$/;

// JavaScript micro-templating, similar to John Resig's implementation.
// Underscore templating handles arbitrary delimiters, preserves whitespace,
// and correctly escapes quotes within interpolated code.
// NB: `oldSettings` only exists for backwards compatibility.
export function compileTemplate(text: string): (data: any) => string {
  const settings = {
    evaluate: /<%([\s\S]+?)%>/g,
    interpolate: /<%=([\s\S]+?)%>/g,
    escape: /<%-([\s\S]+?)%>/g,
  };

  // Combine delimiters into one regular expression via alternation.
  var matcher = RegExp(
    [
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source,
    ].join("|") + "|$",
    "g",
  );

  // Compile the template source, escaping string literals appropriately.
  var index = 0;
  var source = "__p+='";
  text.replace(
    matcher,
    function (
      match: string,
      escape: string,
      interpolate: string,
      evaluate: string,
      offset: number,
    ) {
      source += text.slice(index, offset).replace(escapeRegExp, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offset.
      return match;
    },
  );
  source += "';\n";

  // @ts-expect-error unknown property
  var argument = settings.variable;
  if (argument) {
    // Insure against third-party code injection. (CVE-2021-23358)
    if (!bareIdentifier.test(argument))
      throw new Error("variable is not a bare identifier: " + argument);
  } else {
    // If a variable is not specified, place data values in local scope.
    source = "with(obj||{}){\n" + source + "}\n";
    argument = "obj";
  }

  source =
    "var __t,__p='',__j=Array.prototype.join," +
    "print=function(){__p+=__j.call(arguments,'');};\n" +
    source +
    "return __p;\n";

  var render: Function;
  try {
    render = new Function(argument, "_", source);
  } catch (e) {
    // @ts-expect-error unknown property
    (e as Error).source = source;
    throw e;
  }

  var template = function (data: any) {
    // @ts-expect-error unknown this
    return render.call(this, data, _);
  };

  // Provide the compiled source as a convenience for precompilation.
  // @ts-expect-error unknown property
  template.source = "function(" + argument + "){\n" + source + "}";

  return template;
}
