const express = require("express");

const { SEARCHABLE_ASSETS, findAssetBySymbol, searchAssets } = require("../data/assetCatalog");

const router = express.Router();

router.get("/supported", (_req, res) => {
  res.json({
    count: SEARCHABLE_ASSETS.length,
    assets: SEARCHABLE_ASSETS,
  });
});

router.get("/search", (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q : "";
  const results = searchAssets(query);

  res.json({
    query,
    count: results.length,
    assets: results,
  });
});

router.get("/:symbol", (req, res) => {
  const asset = findAssetBySymbol(req.params.symbol);

  if (!asset) {
    return res.status(404).json({
      error: "Asset not found",
    });
  }

  return res.json(asset);
});

module.exports = router;
