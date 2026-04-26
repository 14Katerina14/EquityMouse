const { QUOTE_SOURCES, METRIC_SOURCES, HOLDER_SOURCES } = require("./scrapingSources.example");

let localOverrides = {};

try {
  localOverrides = require("./private/scrapingSources.private");
} catch (_error) {
  try {
    localOverrides = require("./scrapingSources.local");
  } catch (_nestedError) {
    localOverrides = {};
  }
}

module.exports = {
  QUOTE_SOURCES: localOverrides.QUOTE_SOURCES || QUOTE_SOURCES,
  METRIC_SOURCES: localOverrides.METRIC_SOURCES || METRIC_SOURCES,
  HOLDER_SOURCES: localOverrides.HOLDER_SOURCES || HOLDER_SOURCES,
};
