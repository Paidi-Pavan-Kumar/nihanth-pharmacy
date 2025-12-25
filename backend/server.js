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
import prescriptionRoutes from './routes/prescriptionRoutes.js'
import blogRouter from './routes/blogRoute.js'

//App config
const app = express()
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()

//middleware
app.use(express.json())

// ✅ Simple CORS - Allow All Origins
app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token'],
    credentials: true
}))

//api-end points
app.get("/", (req, res) => {
    res.status(200).send("error");
});
app.use('/api/user', userRouter)
app.use('/api/product', productRouter)
app.use('/api/cart', cartRouter)
app.use('/api/order', orderRouter)
app.use('/api/address', addressRouter)
app.use('/api/contact', contactRouter)
app.use('/api/upload-image', uploadImageRoute)
app.use('/api/blog', blogRouter)
app.use('/api/prescription', prescriptionRoutes)

app.listen(port, ()=> console.log('Server started on PORT : '+ port))