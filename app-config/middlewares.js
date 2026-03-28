const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const winston = require("../config/winston");
const jwtMiddleware = require("../middlewares/jwt.middleware");

module.exports = (app) => {
  app.use(
    cors({
      origin: "*",
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization",
        "IsAnonymous",
        "X-Client-Time",
        "X-Client-Timezone",
        "X-Client-Version",
      ],
    }),
  );

  app.use(express.json({ limit: "1gb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use(morgan("combined", { stream: winston.stream }));
  app.use(jwtMiddleware);
};
