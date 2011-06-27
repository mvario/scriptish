
Components.utils.import("resource://scriptish/constants.js");
Components.utils.import("resource://scriptish/logging.js");

module("Scriptish_log");
var PREF_BRANCH = Services.prefs.getBranch("extensions.scriptish.");

function runListener(callback) {
  var list = {
    observe: function(message) {
      unreg();
      try {
        callback(message);
      }
      finally {
        start();
      }
    }
  };
  var unreg = function() {
    if (!list) {
      return;
    }
    Services.console.unregisterListener(list);
    list = null;
  }
  Services.console.registerListener(list);
  return unreg;
}


asyncTest("extensions.scriptish.logChrome = false", 0, function() {
  var unreg = runListener(function({message}) {
    equal(message, "[Scriptish] TEST");
  });

  var logChrome = null;
  try {
    var logChrome = PREF_BRANCH.getBoolPref("logChrome");
  }
  catch (ex) {}
  PREF_BRANCH.setBoolPref("logChrome", false);

  try {
    Scriptish_log("TEST");
    start();
  }
  finally {
    unreg();
    if (logChrome !== null) {
      PREF_BRANCH.setBoolPref("logChrome", logChrome);
    }
    else {
      PREF_BRANCH.clearUserPref("logChrome", logChrome);
    }
  }
});


asyncTest("extensions.scriptish.logChrome = true", 1, function() {
  runListener(function({message}) {
    equal(message, "[Scriptish] TEST");
  });

  var logChrome = null;
  try {
    var logChrome = PREF_BRANCH.getBoolPref("logChrome");
  }
  catch (ex) {}
  PREF_BRANCH.setBoolPref("logChrome", true);

  try {
    Scriptish_log("TEST");
  }
  finally {
    if (logChrome !== null) {
      PREF_BRANCH.setBoolPref("logChrome", logChrome);
    }
    else {
      PREF_BRANCH.clearUserPref("logChrome", logChrome);
    }
  }
});

asyncTest("null char removed", 1, function() {
  runListener(function({message}) {
    equal(message, "[Scriptish] FORCED TEST WITH NULLS");
  });

  var logChrome = null;
  try {
    var logChrome = PREF_BRANCH.getBoolPref("logChrome");
  }
  catch (ex) {}
  PREF_BRANCH.setBoolPref("logChrome", true);

  try {
    Scriptish_log("FORCED \0TEST \0WITH \0NULLS");
  }
  finally {
    if (logChrome !== null) {
      PREF_BRANCH.setBoolPref("logChrome", logChrome);
    }
    else {
      PREF_BRANCH.clearUserPref("logChrome", logChrome);
    }
  }
});

// logScriptError

asyncTest("logScriptError: js error", 9, function() {
  runListener(function(message) {
    ok(message instanceof Ci.nsIScriptError);
    ok(message instanceof Ci.nsIScriptError2);

    equal(message.errorMessage, "[baz] Error: foo");
    equal(message.sourceName, "chrome://scriptish/content/tests/testScriptishLogger.js");
    equal(message.sourceLine, "");
    ok(message.lineNumber > 10);
    equal(message.columnNumber, 0);
    equal(message.category, "scriptish userscript error");
    equal(message.flags, message.errorFlag);
  });
  Scriptish_logScriptError(new Error("foo"), window, "bar.js", "baz");
});

asyncTest("logScriptError: nsIScriptError", 9, function() {
  runListener(function(message) {
    ok(message instanceof Ci.nsIScriptError);
    ok(message instanceof Ci.nsIScriptError2);

    equal(message.errorMessage, "[baz] foo");
    equal(message.sourceName, "source");
    equal(message.sourceLine, "line");
    equal(message.lineNumber, 0xaa);
    equal(message.columnNumber, 0xff);
    equal(message.category, "category");
    equal(message.flags, message.warningFlag);
  });
  var se = Instances.se;
  se.init("foo", "source", "line", 0xaa, 0xff, se.warningFlag, "category");
  Scriptish_logScriptError(se, window, "bar.js", "baz");
});

asyncTest("logScriptError: nsIScriptError; omit id", 9, function() {
  runListener(function(message) {
    ok(message instanceof Ci.nsIScriptError);
    ok(message instanceof Ci.nsIScriptError2);

    equal(message.errorMessage, "[Scriptish] foo");
    equal(message.sourceName, "source");
    equal(message.sourceLine, "line");
    equal(message.lineNumber, 0xaa);
    equal(message.columnNumber, 0xff);
    equal(message.category, "category");
    equal(message.flags, message.warningFlag);
  });
  var se = Instances.se;
  se.init("foo", "source", "line", 0xaa, 0xff, se.warningFlag, "category");
  Scriptish_logScriptError(se, window);
});

asyncTest("test nsIScriptError; omit optionals", function() {
  expect(9);
  runListener(function(message) {
    ok(message instanceof Ci.nsIScriptError);
    ok(message instanceof Ci.nsIScriptError2);

    equal(message.errorMessage, "[Scriptish] foo");
    equal(message.sourceName, "[user.js]");
    equal(message.sourceLine, "line");
    equal(message.lineNumber, 0xaa);
    equal(message.columnNumber, 0xff);
    equal(message.category, "category");
    equal(message.flags, message.warningFlag);
  });
  var se = Instances.se;
  se.init("foo", "", "line", 0xaa, 0xff, se.warningFlag, "category");
  Scriptish_logScriptError(se, window);
});

asyncTest("test nsIException", function() {
  expect(9);
  runListener(function(message) {
    ok(message instanceof Ci.nsIScriptError);
    ok(message instanceof Ci.nsIScriptError2);

    equal(message.errorMessage, "[baz] foo");
    equal(message.sourceName, "chrome://scriptish/content/tests/testScriptishLogger.js");
    equal(message.sourceLine, "");
    ok(message.lineNumber > 10);
    equal(message.columnNumber, 0);
    equal(message.category, "scriptish userscript error");
    equal(message.flags, message.errorFlag);
  });
  var ex = Components.Exception("foo");
  Scriptish_logScriptError(ex, window, "bar.js", "baz");
});

asyncTest("test TypeError", function() {
  expect(9);
  runListener(function(message) {
    ok(message instanceof Ci.nsIScriptError);
    ok(message instanceof Ci.nsIScriptError2);

    equal(message.errorMessage, "[baz] TypeError: f is undefined");
    equal(message.sourceName, "chrome://scriptish/content/tests/testScriptishLogger.js");
    equal(message.sourceLine, "");
    ok(message.lineNumber > 10);
    equal(message.columnNumber, 0);
    equal(message.category, "scriptish userscript error");
    equal(message.flags, message.errorFlag);
  });
  try {
    var f;
    f.o.o = b.a.r;
  }
  catch (ex) {
    Scriptish_logScriptError(ex, window, "bar.js", "baz");
  }
});

