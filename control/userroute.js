const collection = require("../model/config");
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const userrouter = express.Router();
const flash = require("express-flash");

const nocache = require("nocache");

userrouter.use(express.urlencoded({ extended: true }));
userrouter.use(express.json());

userrouter.use(nocache());

userrouter.use(
  session({
    name: "user-session-id",
    secret: "secretuser",
    resave: false,
    saveUninitialized: true,
  })
);
userrouter.use(flash());

userrouter.get("/", (req, res) => {
  if (req.session.isAuth) {
    req.flash("success");
    res.redirect("/home");
  } else {
    res.render("login", { errorMessage: "", successMessage: "" });
  }
});

userrouter.get("/login", (req, res) => {
  if (req.session.isAuth) {
    req.flash("success");
    res.redirect("/home");
  } else {
    res.render("login", { errorMessage: "", successMessage: "" });
  }
});

userrouter.get("/signup", (req, res) => {
  if (req.session.isAuth) {
    req.flash("success");
    res.redirect("/home");
  } else {
    res.render("signup", { errorMessage: "", successMessage: "" });
  }
});

userrouter.post("/login", async (req, res) => {
  try {
    const user = await collection.findOne({ email: req.body.email });

    if (!user) {
      return res.render("login", {
        errorMessage: "User not found!",
        successMessage: "",
      });
    }

    const passcheck = await bcrypt.compare(req.body.password, user.password);

    if (!passcheck) {
      return res.render("login", {
        errorMessage: "Incorrect password!",
        successMessage: "",
      });
    } else if (user.block) {
      return res.render("login", {
        errorMessage: "User is blocked!",
        successMessage: "",
      });
    } else {
      req.session.isAuth = true;
      req.session.user = req.body.email;
      return res.render("home", {
        username: user.name,
        successMessage: "Logged in successfully",
      });
    }
  } catch (error) {
    console.error(error);
    res.render("login", {
      errorMessage: "Something went wrong!",
      successMessage: "",
    });
  }
});

userrouter.post("/signup", async (req, res) => {
  const data = {
    name: req.body.username,
    password: req.body.password,
    email: req.body.email,
  };

  try {
    const existingUser = await collection.findOne({ email: data.email });

    if (existingUser) {
      return res.render("signup", {
        errorMessage: "Existing user!",
        successMessage: "",
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    data.password = hashedPassword;

    const userData = await collection.create(data);
    console.log(userData);
    res.render("signup", {
      errorMessage: "",
      successMessage: "Signup successfully",
    });
  } catch (error) {
    console.error(error);
    res.render("signup", {
      errorMessage: "Something went wrong during signup!",
      successMessage: "",
    });
  }
});
userrouter.get("/home", async (req, res) => {
  if (req.session.isAuth) {
    try {
      const user = await collection.findOne({ email: req.session.user });

      const userpass = await collection.findOne({
        password: req.body.password,
      });
      if (!user && !userpass) {
        req.session.destroy();
        return res.redirect("/login");
      } else {
        res.render("home", {
          username: user.name,
          successMessage: "successfully loged in",
        });
      }
    } catch (error) {
      console.error(error);
      res.render("login", {
        errorMessage: "Error finding user!",
        successMessage: "",
      });
    }
  } else {
    res.render("login", {
      errorMessage: "Error finding user!",
      successMessage: "",
    });
  }
});

userrouter.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

module.exports = userrouter;
