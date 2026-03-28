var express = require("express");
var router = express.Router();
var access = require("../controllers/access.controller");
var sendResponse = require("../functions/sendResponse");
var auth = require("../middlewares/auth.middleware");
const checkAccess = require("../middlewares/access.middleware");

router.post(
  "/",
  auth.loginRequired,
  checkAccess({ accessKey: "ACCESS" }),
  access.create,
  sendResponse.sendCreateResponse
);

router.get(
  "/",
  auth.loginRequired,
  checkAccess({ accessKey: "ACCESS" }),
  access.getAll,
  sendResponse.sendFindResponse
);

router.get(
  "/:id",
  auth.loginRequired,
  checkAccess({ accessKey: "ACCESS" }),
  access.getById,
  sendResponse.sendFindResponse
);

router.put(
  "/:id",
  auth.loginRequired,
  checkAccess({ accessKey: "ACCESS" }),
  access.update,
  sendResponse.sendCreateResponse
);

module.exports = router;
