const db = require("../models");
const { Role, RoleAccessRelation, Access } = db;
const { HTTPError } = require("../functions/sendResponse");

exports.create = async (req, res, next) => {
  const { roleId, accessData } = req.body;
  const transaction = await db.sequelize.transaction();

  try {
    const result = [];

    for (const item of accessData) {
      const access = await Access.findOne({
        where: { module_code: item.key },
        transaction,
      });
      if (!access) continue;

      const [record, created] = await RoleAccessRelation.findOrCreate({
        where: { role_id: roleId, access_id: access.access_id },
        defaults: { can_view: !!item.canView },
        transaction,
      });

      if (!created) {
        await record.update({ can_view: !!item.canView }, { transaction });
      }

      result.push(record.get({ plain: true }));
    }

    await transaction.commit();
    res.locals.data = result;
    next();
  } catch (err) {
    await transaction.rollback();
    next(HTTPError(500, err.message));
  }
};

exports.getAll = async (req, res, next) => {
  const { roleId, accessId } = req.query;
  const whereClause = {};
  if (roleId) whereClause.role_id = roleId;
  if (accessId) whereClause.access_id = accessId;

  try {
    const relations = await RoleAccessRelation.findAll({
      where: whereClause,
      include: [
        { model: Role, as: "role" },
        { model: Access, as: "access" },
      ],
      order: [["id", "DESC"]],
    });

    res.locals.data = relations.map((r) => r.get({ plain: true }));
    next();
  } catch (err) {
    return next(HTTPError(500, err.message || "Error fetching RoleAccessRelations"));
  }
};

exports.getById = async (req, res, next) => {
  try {
    const user = req.user;
    const { role_id } = req.params;

    if (!user || !user.role_id) {
      return next(HTTPError(401, "Unauthorized"));
    }

    const parsedRoleId = parseInt(role_id, 10);
    if (isNaN(parsedRoleId)) {
      return next(HTTPError(400, "Invalid role_id"));
    }

    const isSuperAdmin =
      user.role?.role_name === "SuperAdmin" ||
      user.role?.role_name === "Briot Admin";

    // 🔐 Non-admins can only access their own role
    if (!isSuperAdmin && parsedRoleId !== user.role_id) {
      return next(HTTPError(403, "Forbidden: cannot access other roles"));
    }

    const relations = await RoleAccessRelation.findAll({
      where: { role_id: parsedRoleId },
      include: [
        { model: Role, as: "role" },
        { model: Access, as: "access" }
      ],
      order: [["id", "DESC"]]
    });

    res.locals.data = relations.map(r => r.get({ plain: true }));
    return next();

  } catch (err) {
    return next(
      HTTPError(500, err.message || "Error fetching role access for role")
    );
  }
};

exports.update = async (req, res, next) => {
  const id = req.params.id;
  const { canView } = req.body;

  const [count] = await RoleAccessRelation.update(
    { can_view: !!canView },
    { where: { id } }
  );
  
  if (!count) return next(HTTPError(404, "Not updated"));

  res.locals.data = await RoleAccessRelation.findByPk(id);
  next();
};

exports.validateAccessUrl = async (req, res, next) => {
  const { key } = req.query;
  const roleId = req.user?.roleId;

  if (!key) {
    res.locals.data = { allowed: false };
    return next();
  }

  const access = await Access.findOne({ where: { module_code: key } });
  if (!access) {
    res.locals.data = { allowed: false };
    return next();
  }

  let relation = await RoleAccessRelation.findOne({
    where: { role_id: roleId, access_id: access.access_id },
  });

  if (!relation && key === "ROLE_ACCESS") {
    const masterAccess = await Access.findOne({ where: { module_code: "ROLE_MASTER" } });
    relation = await RoleAccessRelation.findOne({
      where: { role_id: roleId, access_id: masterAccess?.access_id },
    });
  }

  res.locals.data = { allowed: !!relation?.can_view };
  next();
};
