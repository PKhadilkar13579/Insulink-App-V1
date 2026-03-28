const roleRouter = require("../routes/role.routes");
const usersRouter = require("../routes/user.routes");
const accessRouter = require("../routes/access.routes");
const roleAccessRelationRouter = require("../routes/roleaccessrelation.routes");
const setupDataRouter = require("../routes/setupdataupload.routes");


module.exports = (app) => {
  app.use("/setupdata", setupDataRouter);
  app.use("/role", roleRouter);
  app.use("/users", usersRouter);
  app.use("/access", accessRouter);
  app.use("/roleaccessrelations", roleAccessRelationRouter);
};
