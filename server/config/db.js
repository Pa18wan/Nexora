import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        mongoose.connection.on('connected', () => {
            console.log('📊 Database indexes will be created automatically');
        });

        mongoose.connection.on('error', (err) => {
            console.error(`❌ Database error: ${err.message}`);
        });

        return conn;
    } catch (error) {
        console.error(`❌ Database connection failed: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
