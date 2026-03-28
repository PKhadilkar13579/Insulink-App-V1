"use strict";

const { Role, Sequelize } = require("../models");
const Op = Sequelize.Op;
const { handleError, sendError } = require("../functions/sendResponse");

exports.create = async (req, res, next) => {
  try {
    // 1. Trim the role name immediately to prevent whitespace bypass (e.g., " Admin" becomes "Admin")
    const role_name = req.body.role_name ? req.body.role_name.trim() : "";
    const { status } = req.body;

    if (!role_name || typeof role_name !== "string") {
      return sendError(next, "Role name is required", 400);
    }

    // 2. Check for duplicate role (against the cleaned trimmed value)
    const existingRole = await Role.findOne({ 
      where: { role_name: role_name } 
    });

    if (existingRole) {
      // This specific string will now be caught by the frontend catch block and displayed in the toast
      return sendError(next, "A role with this name already exists", 409);
    }

    const createdRole = await Role.create({
      role_name,
      status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      created_by: req.user.name,
      updated_by: req.user.name
    });

    return res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: createdRole.get({ plain: true })
    });

  } catch (err) {
    // Generic error handler for unexpected DB or Server crashes
    return handleError(err, next, "Internal server error while creating role");
  }
};

exports.bulkupload = async (req, res, next) => {
  try {
    if (!Array.isArray(req.body)) {
      return sendError(next, "Bulk upload payload must be an array", 400);
    }

    const input = req.body;
    let emptyCount = 0;
    let duplicateCount = 0;
    
    // 1. Normalize & Trim
    const normalized = input.map(r => ({
      role_name: typeof r.role_name === "string" ? r.role_name.trim() : "",
      status: r.status === "INACTIVE" ? "INACTIVE" : "ACTIVE"
    }));

    // 2. Filter out empty names
    const validNameRoles = normalized.filter(r => {
      if (!r.role_name) {
        emptyCount++;
        return false;
      }
      return true;
    });

    if (validNameRoles.length === 0) {
      return sendError(next, "No valid role names found in the file", 400);
    }

    // 3. Check for duplicates in Database
    const roleNames = validNameRoles.map(r => r.role_name);
    const existingRoles = await Role.findAll({
      where: { role_name: roleNames },
      attributes: ["role_name"]
    });

    const existingSet = new Set(existingRoles.map(r => r.role_name.toLowerCase()));

    // 4. Filter duplicates
    const seenInPayload = new Set();
    const finalPayload = [];

    for (const r of validNameRoles) {
      const key = r.role_name.toLowerCase();

      if (existingSet.has(key) || seenInPayload.has(key)) {
        duplicateCount++;
        continue;
      }

      seenInPayload.add(key);

      finalPayload.push({
        role_name: r.role_name,
        status: r.status,
        created_by: req.user.name,
        updated_by: req.user.name
      });
    }

    let createdRoles = [];
    if (finalPayload.length > 0) {
      createdRoles = await Role.bulkCreate(finalPayload);
    }

    return res.status(201).json({
      success: true,
      message: "Bulk upload process completed",
      summary: {
        total_received: input.length,
        created: createdRoles.length, // Updated Key
        empty_records: emptyCount,    // Updated Key
        duplicates: duplicateCount    // Updated Key
      },
      data: createdRoles.map(r => r.get({ plain: true }))
    });

  } catch (err) {
    return handleError(err, next, "Internal server error during bulk upload");
  }
};

exports.getAll = async (req, res, next) => {
  try {
    let {
      limit = 100,
      offset = 0,
      orderbyCol = "created_at",
      orderby = "DESC",
      role_name,
      status
    } = req.query;

    limit = parseInt(limit, 10);
    offset = parseInt(offset, 10);

    if (isNaN(limit) || isNaN(offset) || limit < 0 || offset < 0) {
      return sendError(next, "Invalid paging parameters", 400);
    }

    orderby = orderby.toUpperCase();
    if (!["ASC", "DESC"].includes(orderby)) {
      return sendError(next, "Invalid order direction", 400);
    }

    const whereClause = {};

    if (role_name) {
      whereClause.role_name = role_name;
    }

    if (status) {
      whereClause.status = status.toUpperCase();
    }

    const roles = await Role.findAll({
      where: whereClause,
      order: [[orderbyCol, orderby]],
      limit,
      offset
    });

    const total = await Role.count({ where: whereClause });

    res.locals.data = {
      data: roles.map(r => r.get({ plain: true })),
      total
    };

    return next();

  } catch (err) {
    return handleError(err, next, "Error fetching roles");
  }
};

exports.search = async (req, res, next) => {
  try {
    let {
      limit = 100,
      offset = 0,
      orderbyCol = "created_at",
      orderby = "DESC",
      role_name,
      status
    } = req.query;

    limit = Number.isInteger(+limit) && +limit > 0 ? +limit : 100;
    offset = Number.isInteger(+offset) && +offset >= 0 ? +offset : 0;
    limit = Math.min(limit, 100);

    const whereClause = {};

    if (role_name) {
      whereClause.role_name = {
        [Op.like]: `%${role_name}%`
      };
    }

    if (status) {
      whereClause.status = status.toUpperCase();
    }

    const roles = await Role.findAll({
      where: whereClause,
      order: [[orderbyCol, orderby]],
      limit,
      offset
    });

    const total = await Role.count({ where: whereClause });

    res.locals.data = {
      data: roles.map(r => r.get({ plain: true })),
      total,
      limit,
      offset
    };

    next();

  } catch (err) {
    handleError(err, next, "Error searching roles");
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role_name } = req.body;

    if (role_name === undefined) {
      return sendError(
        next,
        "role_name is required",
        400
      );
    }

    if (typeof role_name !== "string" || !role_name.trim()) {
      return sendError(
        next,
        "role_name must be a non-empty string",
        400
      );
    }
    const role = await Role.findByPk(id);

    if (!role) {
      return sendError(next, "Role not found", 404);
    }

    const existingRole = await Role.findOne({ where: { role_name } });
    if (existingRole) {
      return sendError(next, "Role already exists", 409);
    }

    await role.update({
      role_name: role_name.trim(),
      updated_by: req.user.name
    });

    res.locals.data = role.get({ plain: true });
    return next();

  } catch (err) {
    return handleError(err, next, "Error updating role");
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id, 10))) {
      return sendError(next, "Invalid role ID", 400);
    }

    const role = await Role.findByPk(id);

    if (!role) {
      return sendError(next, "Role not found", 404);
    }

    res.locals.data = role.get({ plain: true });
    return next();

  } catch (err) {
    return handleError(err, next, "Error fetching role by ID");
  }
};

exports.patchStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
 
    if (!status) {
      return sendError(next, "Status is required", 400);
    }

    if (typeof status !== "string") {
      return sendError(next, "Status must be a string", 400);
    }
 
    const formattedStatus = status.toUpperCase();
 
    if (!["ACTIVE", "INACTIVE"].includes(formattedStatus)) {
      return sendError(
        next,
        "Invalid status value. Allowed values: ACTIVE, INACTIVE",
        400
      );
    }
 
    const role = await Role.findByPk(id);
    if (!role) {
      return sendError(next, "Role not found", 404);
    }
 
    await role.update({
      status: formattedStatus,
      updated_by: req.user.name
    });
 
    req.updatedData  = role.get({ plain: true });
    next();
 
  } catch (err) {
    handleError(err, next, "Error updating role status");
  }
};