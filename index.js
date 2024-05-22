const express = require("express");
const app = express();
const nocache = require("nocache");
const userroutes = require("./control/userroute");
const adminRoutes = require("./control/adminroute");
const path = require("path");
app.use("/", userroutes);

app.use(
  nocache({
    headers: {
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache",
    },
  })
);

app.use("/admin", adminRoutes);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("views"));
app.use(express.static("public"));

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
