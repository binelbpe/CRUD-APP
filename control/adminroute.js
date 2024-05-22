const express = require("express");
const adminrouter = express.Router();
const collection = require("../model/config");
const session = require("express-session");
const bcrypt = require("bcrypt");
const flash = require("express-flash");

adminrouter.use(express.urlencoded({ extended: true }));
adminrouter.use(express.json());

adminrouter.use(
  session({
    name: "admin-session-id",
    secret: "secretadmin",
    resave: false,
    saveUninitialized: true,
  })
);
adminrouter.use(flash());

adminrouter.get("/", (req, res) => {
  if (req.session.isadmin) {
    res.redirect("/admin/dashboard");
  } else {
    res.render("adminlogin", {
      errorMessage: "",
    });
  }
});
adminrouter.get("/adminlogin", (req, res) => {
  if (req.session.isadmin) {
    res.redirect("/admin/dashboard");
  } else {
    res.render("adminlogin", {
      errorMessage: "",
    });
  }
});
adminrouter.post("/adminlogin", async (req, res) => {
  try {
    const check = await collection.findOne({ name: req.body.username });

    if (!check) {
      res.render("adminlogin", {
        errorMessage: "User not found!",
      });
    }

    const passcheck = await bcrypt.compare(req.body.password, check.password);

    if (!passcheck) {
      res.render("adminlogin", {
        errorMessage: "Incorrect password!",
      });
    }

    if (check.isAdmin === true) {
      req.session.isadmin = true;
      req.session.user = req.body.username;
      res.redirect("/admin/dashboard");
    } else {
      res.render("adminlogin", {
        errorMessage: "User is not an admin!",
      });
    }
  } catch (error) {
    console.error(error);
    res.render("adminlogin", {
      errorMessage: "Something went wrong!",
    });
  }
});

adminrouter.get("/dashboard", async (req, res) => {
  try {
    if (req.session.isadmin) {
      const users = await collection.find({ isAdmin: false });
      res.render("dashboard", {
        users,
        errorMessage: req.flash("error"),
        successMessage: req.flash("success"),
      });
    } else {
      res.render("adminlogin", {
        users: [],
        errorMessage: "Please login again.",
      });
    }
  } catch (error) {
    console.error(error);
    res.render("dashboard", {
      users: [],
      errorMessage: "Error fetching users!",
      successMessage: req.flash("success"),
    });
  }
});

// Edit user route
adminrouter.get("/edit/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    if (req.session.isadmin) {
      const user = await collection.findById(userId);
      res.render("adminedituser", { user, errorMessage: req.flash("error") });
    } else {
      res.render("adminlogin", {
        errorMessage: "Please login again!",
      });
    }
  } catch (error) {
    console.error(error);
    res.redirect("/admin");
  }
});

// Update user route (handle form submission for editing)
adminrouter.post("/adminedituser/:userId", async (req, res) => {
  const userId = req.params.userId;
  if (req.session.isadmin) {
    console.log("this is user id", userId);
    const updatedData = {
      name: req.body.username,
      email: req.body.email,
    };

    try {
      const existingUser = await collection.findOne({
        email: updatedData.email,
      });
      const user = await collection.findById(userId);
      let updatedUser;
      if (existingUser && existingUser._id.toString() !== userId) {
        console.log("User with this email already exists");
        res.render("adminedituser", {
          user,
          errorMessage: "User already exists",
        });
      } else {
        updatedUser = await collection.findByIdAndUpdate(userId, updatedData, {
          new: true,
        });
        console.log("User updated:", updatedUser);
        req.flash("success", "User details updated!");
        res.redirect("/admin/dashboard");
      }
    } catch (error) {
      console.error(error);
      res.render("adminlogin", {
        errorMessage: "Please login again",
      });
    }
  } else {
    res.render("adminlogin", {
      errorMessage: "Please login again",
    });
  }
});

adminrouter.post("/searchUser", async (req, res) => {
  if (req.session.isadmin) {
    try {
      const searchQuery = req.body.searchUser;

      const foundUsers = await collection.find({
        name: { $regex: new RegExp(searchQuery, "i") },
        isAdmin: false,
      });

      res.render("dashboard", {
        users: foundUsers,
        searchQuery,
        errorMessage: req.flash("error"),
        successMessage: req.flash("success"),
      });
    } catch (error) {
      req.flash("error", "User not found!");
      res.redirect("/admin/dashboard");
    }
  } else {
    res.render("adminlogin", {
      errorMessage: "Please login again",
    });
  }
});

// Delete user route
adminrouter.get("/delete/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    await collection.findByIdAndDelete(userId);
    console.log("User deleted");
    req.flash("success", "User deleted!");
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.error(error);
    req.flash("error", "Something error happened!");
    res.redirect("/admin/dashboard");
  }
});

// block user route
adminrouter.get("/block/:userId", async (req, res) => {
  const userId = req.params.userId;
  if (req.session.isadmin) {
    console.log("this is user id", userId);
    const blockData = {
      block: true,
    };
    try {
      updatedUser = await collection.findByIdAndUpdate(userId, blockData, {
        new: true,
      });
      console.log("User updated:", updatedUser);
      req.flash("success", "User blocked!");
      res.redirect("/admin/dashboard");
    } catch (error) {
      console.error(error);
      req.flash("error", "Something error happened!");
      res.redirect("/admin/dashboard");
    }
  }
});

// unblock user route
adminrouter.get("/unblock/:userId", async (req, res) => {
  const userId = req.params.userId;
  if (req.session.isadmin) {
    console.log("this is user id", userId);
    const unblockData = {
      block: false,
    };
    try {
      updatedUser = await collection.findByIdAndUpdate(userId, unblockData, {
        new: true,
      });
      console.log("User updated:", updatedUser);
      req.flash("success", "User Unblocked!");
      res.redirect("/admin/dashboard");
    } catch (error) {
      console.error(error);
      req.flash("error", "Something error happened!");
      res.redirect("/admin/dashboard");
    }
  }
});

adminrouter.get("/adlogout", (req, res) => {
  req.session.destroy();
  res.redirect("/admin/adminlogin");
});

adminrouter.get("/createUser", (req, res) => {
  if (req.session.isadmin) {
    res.render("createUser", {
      errorMessage: req.flash("error"),
      successMessage: req.flash("success"),
    });
  } else {
    res.render("adminlogin", {
      errorMessage: "Please login again",
    });
  }
});

adminrouter.post("/createUser", async (req, res) => {
  if (req.session.isadmin) {
    try {
      // Validate input fields
      if (!req.body.username || !req.body.password || !req.body.email) {
        res.render("createUser", {
          errorMessage: "Please fill all the fields!",
          successMessage: req.flash("success"),
        });
      }

      const newdata = {
        name: req.body.username,
        password: req.body.password,
        email: req.body.email,
      };

      const existinnewgUser = await collection.findOne({
        email: newdata.email,
      });

      if (existinnewgUser) {
        return res.render("createUser", {
          errorMessage: "Existing user!",
          successMessage: req.flash("success"),
        });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newdata.password, saltRounds);

      newdata.password = hashedPassword;

      const result = await collection.insertMany(newdata);
      console.log(result);

      console.log("created new user", newdata.name);
      res.render("createUser", {
        successMessage: "New user created",
        errorMessage: "",
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.render("createUser", {
        errorMessage: "Something happened!",
        successMessage: req.flash("success"),
      });
    }
  } else {
    res.render("adminlogin", {
      errorMessage: "Please login again",
    });
  }
});

module.exports = adminrouter;
