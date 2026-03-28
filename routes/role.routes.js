var express = require("express");
var router = express.Router();
var roles = require("../controllers/role.controller");
var sendResponse = require("../functions/sendResponse");
var auth = require("../middlewares/auth.middleware");
const checkAccess = require("../middlewares/access.middleware");

router.post(
  "/",
  auth.loginRequired,
  checkAccess({ accessKey: "ROLE_MASTER" }),
  roles.create,
  sendResponse.sendCreateResponse
);

router.post(
  "/bulkupload",
  auth.loginRequired,
  checkAccess({ accessKey: "ROLE_MASTER" }),
  roles.bulkupload,
  sendResponse.sendCreateResponse
);

router.get(
  "/",
  auth.loginRequired,
  checkAccess({ accessKey: "ROLE_MASTER" }),
  roles.getAll,
  sendResponse.sendFindResponse
);

router.get(
  "/:id",
  auth.loginRequired,
  checkAccess({ accessKey: "ROLE_MASTER" }),
  roles.getById,
  sendResponse.sendFindResponse
);

router.get(
  "/search/records",
  auth.loginRequired,
  checkAccess({ accessKey: "ROLE_MASTER" }),
  roles.search,
  sendResponse.sendFindResponse
);

router.put(
  "/:id",
  auth.loginRequired,
  checkAccess({ accessKey: "ROLE_MASTER" }),
  roles.update,
  sendResponse.sendCreateResponse
);

router.patch(
  "/:id/status",
  auth.loginRequired,
  checkAccess({ accessKey: "ROLE_MASTER" }),
  roles.patchStatus,
  sendResponse.sendCreateResponse
);
module.exports = router;
