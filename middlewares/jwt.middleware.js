const jwt = require("jsonwebtoken");
const { User, Role } = require("../models");
const { SECRET } = require("../config/user.config");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("JWT ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET);

    const user = await User.findOne({
      where: {
        user_id: decoded.userId,    
        account_status: "ACTIVE",       
      },
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["role_id", "role_name"], 
        },
      ],
    });

    req.user = user ? user.get({ plain: true }) : null;
    next();
  } catch (err) {
    console.error("❌ JWT auth error:", err.message);
    req.user = null;
    next();
  }
};
