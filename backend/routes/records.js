const express = require('express');
const { ObjectId } = require('mongodb');
const database = require('../config/database');

const router = express.Router();

// Middleware to ensure database connection
const ensureDatabaseConnection = async (req, res, next) => {
    try {
        if (!database.isConnected) {
            await database.connect();
        }
        next();
    } catch (error) {
        res.status(500).json({
            error: 'Database connection failed',
            message: error.message
        });
    }
};

// GET /api/records - Get all farming records
router.get('/', ensureDatabaseConnection, async (req, res) => {
    try {
        const collection = database.getCollection('farming_records');
        const records = await collection.find({}).sort({ createdAt: -1 }).toArray();

        // Convert ObjectId to string for JSON response
        const formattedRecords = records.map(record => ({
            ...record,
            _id: record._id.toString()
        }));

        res.json({
            success: true,
            data: formattedRecords,
            count: formattedRecords.length
        });
    } catch (error) {
        console.error('Error fetching records:', error);
        res.status(500).json({
            error: 'Failed to fetch records',
            message: error.message
        });
    }
});

// POST /api/records - Create a new farming record
router.post('/', ensureDatabaseConnection, async (req, res) => {
    try {
        const { cropName, plantingDate, expectedHarvest, notes, soilType } = req.body;

        // Validation
        if (!cropName || !plantingDate) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Crop name and planting date are required'
            });
        }

        const collection = database.getCollection('farming_records');
        const newRecord = {
            cropName,
            plantingDate,
            expectedHarvest: expectedHarvest || null,
            notes: notes || '',
            soilType: soilType || 'Not specified',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const result = await collection.insertOne(newRecord);

        res.status(201).json({
            success: true,
            data: {
                ...newRecord,
                _id: result.insertedId.toString()
            },
            message: 'Record created successfully'
        });
    } catch (error) {
        console.error('Error creating record:', error);
        res.status(500).json({
            error: 'Failed to create record',
            message: error.message
        });
    }
});

// PUT /api/records/:id - Update a farming record
router.put('/:id', ensureDatabaseConnection, async (req, res) => {
    try {
        const { id } = req.params;
        const { cropName, plantingDate, expectedHarvest, notes, soilType } = req.body;

        // Validation
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                error: 'Invalid record ID',
                message: 'The provided ID is not valid'
            });
        }

        if (!cropName || !plantingDate) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Crop name and planting date are required'
            });
        }

        const collection = database.getCollection('farming_records');
        const updateData = {
            cropName,
            plantingDate,
            expectedHarvest: expectedHarvest || null,
            notes: notes || '',
            soilType: soilType || 'Not specified',
            updatedAt: new Date().toISOString()
        };

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                error: 'Record not found',
                message: 'No record found with the provided ID'
            });
        }

        res.json({
            success: true,
            data: {
                _id: id,
                ...updateData
            },
            message: 'Record updated successfully'
        });
    } catch (error) {
        console.error('Error updating record:', error);
        res.status(500).json({
            error: 'Failed to update record',
            message: error.message
        });
    }
});

// DELETE /api/records/:id - Delete a farming record
router.delete('/:id', ensureDatabaseConnection, async (req, res) => {
    try {
        const { id } = req.params;

        // Validation
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                error: 'Invalid record ID',
                message: 'The provided ID is not valid'
            });
        }

        const collection = database.getCollection('farming_records');
        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                error: 'Record not found',
                message: 'No record found with the provided ID'
            });
        }

        res.json({
            success: true,
            message: 'Record deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting record:', error);
        res.status(500).json({
            error: 'Failed to delete record',
            message: error.message
        });
    }
});

// GET /api/records/health - Health check for records service
router.get('/health', async (req, res) => {
    try {
        const dbHealth = await database.healthCheck();
        res.json({
            success: true,
            service: 'records',
            database: dbHealth,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            service: 'records',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
