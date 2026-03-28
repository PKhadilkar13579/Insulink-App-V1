const bcrypt = require("bcrypt");
const { User } = require("../models");
const { sendError } = require("../functions/sendResponse");

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, targetUserId } = req.body;

    const user = await User.findByPk(targetUserId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // --- NEW CHECK START ---
    if (oldPassword === newPassword) {
      return res.status(400).json({ 
        message: "New password cannot be the same as the old password" 
      });
    }
    // --- NEW CHECK END ---

    // 3. HASH NEW PASSWORD
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. UPDATE PASSWORD
    user.password = hashedPassword;
    await user.save();

    return res.json({ message: "Password updated successfully" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};