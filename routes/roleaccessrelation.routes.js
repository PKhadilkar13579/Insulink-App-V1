const express = require("express");
const router = express.Router();
const roleAccessController = require("../controllers/roleaccessrelation.controller");
const sendResponse = require("../functions/sendResponse");
const auth = require("../middlewares/auth.middleware");
const checkAccess = require("../middlewares/access.middleware");

router.post(
  "/",
  auth.loginRequired,
  checkAccess({ accessKey: "ROLE_ACCESS" }),
  roleAccessController.create,
  sendResponse.sendCreateResponse
);

router.get(
  "/",
  auth.loginRequired,
  checkAccess({ accessKey: "ROLE_ACCESS" }),
  roleAccessController.getAll,
  sendResponse.sendFindResponse
);

router.get(
  "/getmyaccesses/:role_id",
  auth.loginRequired,
  // checkAccess({ accessKey: "ROLE_ACCESS" }),
  roleAccessController.getById,
  sendResponse.sendFindResponse
);

router.put(
  "/:id",
  auth.loginRequired,
  checkAccess({ accessKey: "ROLE_ACCESS" }),
  roleAccessController.update,
  sendResponse.sendCreateResponse
);

router.get(
  "/get/validateaccessurl",
  auth.loginRequired,
  roleAccessController.validateAccessUrl,
  sendResponse.sendFindResponse
);

module.exports = router;
