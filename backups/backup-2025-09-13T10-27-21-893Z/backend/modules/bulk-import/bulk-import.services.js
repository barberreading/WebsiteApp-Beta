const fs = require('fs');
const csv = require('csv-parser');
const User = require('../../models/User');
const Client = require('../../models/Client');
const ErrorResponse = require('../../utils/errorResponse');

exports.getTemplate = (type) => {
    if (type === 'clients') {
        return 'name,email,phone,address,city,postcode,notes\n';
    } else if (type === 'users') {
        return 'name,email,phone,role,password,notes\n';
    } else {
        return null;
    }
}

const processCsv = (filePath, model, requiredFields, fieldProcessor) => {
    return new Promise((resolve, reject) => {
        const results = [];
        const errors = [];
        let successCount = 0;

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', async (data) => {
                const missingField = requiredFields.find(field => !data[field]);
                if (missingField) {
                    errors.push({ row: data, error: `${missingField} is required` });
                    return;
                }

                try {
                    const processedData = fieldProcessor(data);
                    const existingRecord = await model.findOne({ email: processedData.email });
                    if (existingRecord) {
                        errors.push({ row: data, error: 'Record with this email already exists' });
                        return;
                    }

                    const newRecord = new model(processedData);
                    await newRecord.save();
                    successCount++;
                    results.push(newRecord);
                } catch (error) {
                    errors.push({ row: data, error: error.message });
                }
            })
            .on('end', () => {
                fs.unlinkSync(filePath);
                resolve({
                    message: `Import completed. ${successCount} records imported successfully.`,
                    success: successCount,
                    errors: errors,
                    results: results
                });
            })
            .on('error', (error) => {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                reject(new ErrorResponse('Error processing CSV file', 500));
            });
    });
}

exports.uploadClients = (filePath) => {
    const requiredFields = ['name', 'email'];
    const fieldProcessor = (data) => ({
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        postcode: data.postcode || '',
        notes: data.notes || ''
    });

    return processCsv(filePath, Client, requiredFields, fieldProcessor);
}

exports.uploadUsers = (filePath) => {
    const requiredFields = ['name', 'email', 'role', 'password'];
    const fieldProcessor = (data) => {
        const validRoles = ['staff', 'manager', 'superuser'];
        if (!validRoles.includes(data.role)) {
            throw new Error('Invalid role. Must be staff, manager, or superuser');
        }
        return {
            name: data.name,
            email: data.email,
            phone: data.phone || '',
            role: data.role,
            password: data.password,
            notes: data.notes || ''
        };
    };

    return processCsv(filePath, User, requiredFields, fieldProcessor);
}