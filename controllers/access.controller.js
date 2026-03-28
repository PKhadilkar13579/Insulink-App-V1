const db = require("../models");
const { Access } = require("../models");
const HTTPError = require("http-errors");
const { handleError, sendError } = require("../functions/sendResponse");
const { Op } = require("sequelize");



class WhereBuilder {
  constructor() {
    this.clauseObj = {};
  }

  clause(key, value) {
    if (value !== undefined && value !== null && value !== "") {
      this.clauseObj[key] = value;
    }
    return this;
  }

  toJSON() {
    return this.clauseObj;
  }
}

exports.create = async (req, res, next) => {
  try {
    const { module_code, module_name } = req.body;

    if (!module_code || !module_name) {
      return sendError(
        next,
        "module_code and module_name are required",
        400
      );
    }

    const payload = {
      module_code: module_code.trim(),
      module_name: module_name.trim()
    };

    if (!payload.module_code || !payload.module_name) {
      return sendError(
        next,
        "module_code and module_name cannot be empty",
        400
      );
    }
        const existing = await Access.findOne({
      where: {
        [Op.or]: [
          { module_code: payload.module_code }
        ]
      }
    });

    if (existing) {
      return sendError(
        next,
        "Access module with same code or name already exists",
        409
      );
    }
    const created = await Access.create(payload);

    res.status(201);
    res.locals.data = created.get({ plain: true });
    return next();

  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return sendError(
        next,
        "Access module already exists",
        409
      );
    }

    if (err.name === "SequelizeValidationError") {
      return sendError(
        next,
        err.errors.map(e => e.message).join(", "),
        400
      );
    }

    return handleError(err, next, "Error creating access");
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const { module_code } = req.query;

    if (module_code !== undefined && typeof module_code !== "string") {
      return sendError(
        next,
        "Invalid module_code query parameter",
        400
      );
    }

    const whereClause = {};
    if (module_code) {
      whereClause.module_code = module_code.trim();
    }

    const list = await Access.findAll({
      where: whereClause,
      order: [["access_id", "ASC"]],
    });

    res.locals.data = list.map(a => a.get({ plain: true }));
    return next();

  } catch (err) {
    return handleError(err, next, "Error fetching access list");
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return sendError(
        next,
        "Invalid access ID",
        400
      );
    }

    const access = await Access.findByPk(id);

    if (!access) {
      return sendError(
        next,
        "Access not found",
        404
      );
    }

    res.locals.data = access.get({ plain: true });
    return next();

  } catch (err) {
    return handleError(err, next, "Error fetching access");
  }
};

exports.update = async (req, res, next) => {
  try {
    const { module_code } = req.params;
    const { module_name } = req.body;

    if (typeof module_name !== "string" || typeof  module_code !== "string") {
      return sendError(
        next,
        "module_name and module_code are required",
        400
      );
    }

    const trimmedName = module_name.trim();
    const trimmedCode = module_code.trim();

    if (!trimmedName || !trimmedCode) {
      return sendError(
        next,
        "module_name and/or module_code cannot be empty",
        400
      );
    }

    const access = await Access.findOne({
      where: {
        module_code: trimmedCode
      }
    });
    if (!access) {
      return sendError(
        next,
        "Access not found",
        404
      );
    }

    const duplicate = await Access.findOne({
      where: {
        module_name: trimmedName,
        module_code: { [Op.ne]: trimmedCode }
      }
    });

    if (duplicate) {
      return sendError(
        next,
        "Access module name already exists",
        409
      );
    }

    await access.update({
      module_name: trimmedName,
      module_code: trimmedCode
    });

    res.locals.data = access.get({ plain: true });
    return next();

  } catch (err) {
    return handleError(err, next, "Error updating access");
  }
};


