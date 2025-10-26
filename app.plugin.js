// app.plugin.js
const { withAndroidManifest, withInfoPlist, createRunOncePlugin } = require("@expo/config-plugins");

function ensureMeta(app, name, value) {
  app["meta-data"] = app["meta-data"] || [];
  const i = app["meta-data"].findIndex(m => m.$["android:name"] === name);
  if (i >= 0) app["meta-data"][i].$["android:value"] = value;
  else app["meta-data"].push({ $: { "android:name": name, "android:value": value } });
}

const withGoogleMapsApiKeys = config => {
  const androidKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const iosKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY || "";

  return withAndroidManifest(withInfoPlist(config, cfg => {
    if (iosKey) cfg.modResults.GMSApiKey = iosKey;
    return cfg;
  }), cfg => {
    const app = cfg.modResults.manifest.application?.[0];
    if (app && androidKey) ensureMeta(app, "com.google.android.geo.API_KEY", androidKey);
    return cfg;
  });
};

module.exports = createRunOncePlugin(withGoogleMapsApiKeys, "with-google-maps-api-keys", "1.0.0");
