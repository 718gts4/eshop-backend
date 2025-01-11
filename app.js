const express = require("express");
const app = express();
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv/config");
const authJwt = require("./helpers/jwt");
const { superAdminMiddleware } = require("./common-middleware");
const errorHandler = require("./helpers/error-handler");
const backgroundService = require("./backgroundService");
const jwt = require('jsonwebtoken');

// when in development, allow requests from localhost:3000.
// heroku sets NODE_ENV to production by default for hosted apps. 
// When running locally, NODE_ENV is undefined
const isProduction = process.env.NODE_ENV === "production";
console.log("NODE_ENV:", process.env.NODE_ENV,{isProduction});

const corsOptions = isProduction
    ? {} 
    : {
        origin: "http://localhost:3000", // Allow requests from your frontend server
        methods: "GET,POST,PUT,PATCH,DELETE",
        allowedHeaders: "Content-Type,Authorization",
    };

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

//Middleware
app.use(express.json());
app.use(morgan("tiny"));
app.use(authJwt());
app.use(errorHandler);
app.use("/uploads", express.static(__dirname + "/uploads"));

// Debug route to generate JWT tokens
app.get('/debug/generate-token/:userId/:role', (req, res) => {
    const { userId, role } = req.params;
    const token = jwt.sign(
        { userId: userId, role: role },
        process.env.secret,
        { expiresIn: '1d' }
    );
    console.log(`Generated token for user ${userId} with role ${role}:`, token);
    res.json({ token });
});

//Routes
const productsRoutes = require("./routes/products");
const categoriesRoutes = require("./routes/categories");
const ordersRoutes = require("./routes/orders");
const usersRoutes = require("./routes/users");
const videosRoutes = require("./routes/videos");
const adminRoutes = require("./routes/admin/auth");
const videoCommentRoutes = require("./routes/video-comments");
const bookmarkRoutes = require("./routes/bookmark");
const addressRoutes = require("./routes/address");
const cardRoutes = require("./routes/card");
const questionRoutes = require("./routes/questions");
const recentlyViewedRoutes = require("./routes/recentlyViewed");
const canceledOrderRoutes = require("./routes/canceledOrder");
const purchaseRoutes = require("./routes/purchase");
const vendorRoutes = require("./routes/vendor");
const clientRoutes = require("./routes/client");
const returnBankRoutes = require("./routes/returnBank");
const vendorSupportQueryRoutes = require("./routes/vendor-support-query");
const vendorSupportQueryController = require("./controllers/vendor-support-query");
const paymentRoutes = require("./routes/payment");
const superadminRoutes = require("./routes/superadmin-question")

const api = process.env.API_URL;

//Routers
app.use(`${api}/products`, productsRoutes);
app.use(`${api}/categories`, categoriesRoutes);
app.use(`${api}/orders`, ordersRoutes);
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/videos`, videosRoutes);
app.use(`${api}/admin`, adminRoutes);
app.use(`${api}/videocomments`, videoCommentRoutes);
app.use(`${api}/bookmarks`, bookmarkRoutes);
app.use(`${api}/address`, addressRoutes);
app.use(`${api}/card`, cardRoutes);
app.use(`${api}/questions`, questionRoutes);
app.use(`${api}/recentlyViewed`, recentlyViewedRoutes);
app.use(`${api}/canceledOrder`, canceledOrderRoutes);
app.use(`${api}/purchase`, purchaseRoutes);
app.use(`${api}/vendor`, vendorRoutes);
app.use(`${api}/client`, clientRoutes);
app.use(`${api}/returnBank`, returnBankRoutes);
app.use(`${api}/vendor-support-query`, vendorSupportQueryRoutes);
app.use(`${api}/payment`, paymentRoutes);
app.use(`${api}/superadminQuestions`, superadminRoutes);

// Schedule the task to run periodically (e.g., every hour)
setInterval(backgroundService.updateProductsOnSaleStatus, 3600000);
mongoose
    .connect(process.env.CONNECTION_STRING)
    .then(() => {
        console.log("Database connection is ready...");
    })
    .catch((err) => {
        console.log(err);
    });

// Production
const port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("Express server is working on port " + port);
});
