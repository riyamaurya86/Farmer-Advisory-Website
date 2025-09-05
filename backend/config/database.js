const { MongoClient } = require('mongodb');

class Database {
    constructor() {
        this.client = null;
        this.db = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            const connectionString = process.env.MONGODB_URI;

            if (!connectionString) {
                throw new Error('MongoDB connection string not found in environment variables');
            }

            this.client = new MongoClient(connectionString, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });

            await this.client.connect();
            this.db = this.client.db('digital_krishi_officer');
            this.isConnected = true;

            console.log('✅ Connected to MongoDB Atlas');
            return true;
        } catch (error) {
            console.error('❌ MongoDB connection failed:', error);
            this.isConnected = false;
            throw error;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.isConnected = false;
            console.log('Disconnected from MongoDB');
        }
    }

    getCollection(name) {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }
        return this.db.collection(name);
    }

    async healthCheck() {
        try {
            if (!this.isConnected) {
                return { status: 'disconnected', message: 'Database not connected' };
            }

            await this.db.admin().ping();
            return { status: 'connected', message: 'MongoDB Atlas connection healthy' };
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }
}

// Create and export a singleton instance
const database = new Database();
module.exports = database;
