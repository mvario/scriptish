// Checks if Scriptish was updated/installed
(function(inc, tools) {
  inc("resource://scriptish/prefmanager.js", tools);
  inc("resource://scriptish/constants.js", tools);
  inc("resource://gre/modules/AddonManager.jsm", tools);

  var pref = tools.Scriptish_prefRoot;
  var currentVer = pref.getValue("version", "0.0");

  // update the currently initialized version so we don't do this work again.
  tools.AddonManager.getAddonByID("scriptish@erikvold.com", function(aAddon) {
    pref.setValue("version", aAddon.version);
  });

  if (0 >= tools.Services.vc.compare(currentVer, "0.1b5")) {
    var chromeWin = tools.Services.wm.getMostRecentWindow("navigator:browser");
    (chromeWin.Browser ? chromeWin.Browser : chromeWin.gBrowser)
        .addTab("about:scriptish");

    // add toolbaritem to add-on bar
    var addToBar = chromeWin.document.getElementById("addon-bar");
    if (!addToBar || chromeWin.document.getElementById("scriptish-button"))
      return;
    var addonSet = (addToBar.getAttribute("currentset") || addToBar.getAttribute("defaultset")).split(",");
    var addonPos = addonSet.indexOf("status-bar");
    if (addonPos == -1) addonPos = addonSet.length;
    addonSet.splice(addonPos, 0, "scriptish-button");
    addonSet = addonSet.join(",");
    addToBar.setAttribute("currentset", addonSet);
    addToBar.currentSet = addonSet;
    chromeWin.BrowserToolboxCustomizeDone(true);
    chromeWin.document.persist(addToBar.getAttribute("id"), "currentset");
    if ("addon-bar" == addToBar.getAttribute("id")) addToBar.collapsed = false;
  }
})(Components.utils.import, {})
