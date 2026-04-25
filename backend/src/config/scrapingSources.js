const { QUOTE_SOURCES, METRIC_SOURCES } = require("./scrapingSources.example");

let localOverrides = {};

try {
  localOverrides = require("./scrapingSources.local");
} catch (_error) {
  localOverrides = {};
}

module.exports = {
  QUOTE_SOURCES: localOverrides.QUOTE_SOURCES || QUOTE_SOURCES,
  METRIC_SOURCES: localOverrides.METRIC_SOURCES || METRIC_SOURCES,
};
