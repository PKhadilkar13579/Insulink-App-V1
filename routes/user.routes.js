'use strict';

const express = require("express");
const router = express.Router();
const users = require("../controllers/user.controller");
const auth = require("../middlewares/auth.middleware");
const checkAccess = require("../middlewares/access.middleware");
const authController = require("../controllers/auth");
const sendResponse = require("../functions/sendResponse");

router.post(
  "/sign-in",
  auth.getUser,
  auth.matchPassword,
  auth.sign_in,
  sendResponse.sendFindResponse
);

router.put(
  "/change-password",
  auth.loginRequired,
  authController.changePassword
);

router.get(
  "/search/records",
  auth.loginRequired,
  // checkAccess({ accessKey: "USER_MASTER" }),
  users.search,
  sendResponse.sendFindResponse
);

router.post(
  "/",
  auth.loginRequired,
  checkAccess({ accessKey: "USER_MASTER" }),
  users.create,
  sendResponse.sendCreateResponse
);

router.get(
  "/",
  auth.loginRequired,
  checkAccess({ accessKey: "USER_MASTER" }),
  users.getAll,
  sendResponse.sendFindResponse
);

router.post(
  "/bulk-upload",
  auth.loginRequired,
  checkAccess({ accessKey: "USER_MASTER" }),
  users.bulkUpload,
  sendResponse.sendCreateResponse
);

router.get(
  "/:user_id",
  auth.loginRequired,
  checkAccess({ accessKey: "USER_MASTER" }),
  users.getById,
  sendResponse.sendFindResponse
);

router.put(
  "/:user_id",
  auth.loginRequired,
  // checkAccess({ accessKey: "USER_MASTER" }),
  users.update,
  sendResponse.sendCreateResponse
);

module.exports = router;
