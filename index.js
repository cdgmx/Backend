//Get the package from node.js
const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userRoutes = require("./routes/UserRoutes");
const { NotFound, ErrorHandler } = require("./middlewares/ErrorMiddleware");

const app = express();
dotenv.config();
connectDB();
app.use(express.json());


app.use("/api/users", userRoutes);

app.use(NotFound);
app.use(ErrorHandler);

const PORT = process.env.PORT || 5000;

//Web server
const server = app.listen(PORT, console.log(`Server started on PORT ${PORT}`));


