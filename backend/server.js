import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import userRouter from './routes/userRoutes.js'
import productRouter from './routes/productRoute.js'
import cartRouter from './routes/cartRoute.js'
import orderRouter from './routes/orderRoute.js'
import addressRouter from './routes/addressRoute.js'
import contactRouter from './routes/contactRoutes.js'
import uploadImageRoute from './routes/uploadImageRoute.js'
import blogRouter from './routes/blogRoute.js'

//App config
const app = express()
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()

//middleware
app.use(express.json())
app.use(cors({
    origin: [
      process.env.FRONTEND_URL, 
      process.env.ADMIN_URL,
      "https://ymgs-admin.vercel.app",
      "https://ymgs-frontend.vercel.app"
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token'],
    exposedHeaders: ['Content-Type', 'Authorization', 'token'],
    credentials: true
}))

// ✅ Global CORS Response Headers Middleware
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, token");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
  });

//api-end points
app.get("/", (req, res) => {
    res.status(200).send("YMGS pharmacy Backend");
  });
app.use('/api/user', userRouter)
app.use('/api/product', productRouter)
app.use('/api/cart', cartRouter)
app.use('/api/order', orderRouter)
app.use('/api/address', addressRouter)
app.use('/api/contact', contactRouter)
app.use('/api/upload-image', uploadImageRoute)
app.use('/api/blog', blogRouter)

app.listen(port, ()=> console.log('Server started on PORT : '+ port))