const Client = require('../../models/Client');

const getClients = async (user) => {
    let filter = {};
    
    // GDPR Compliance: Role-based access control
    if (user.role === 'client') {
        // Clients can only see their own client record
        if (!user.clientId) {
            return []; // No client record linked
        }
        filter._id = user.clientId;
    } else {
        // Staff users: Apply test user isolation
        if (user && user.isTestUser) {
            filter.isTestUser = true;
        } else if (user && !user.isTestUser) {
            filter.isTestUser = { $ne: true };
        }
        
        // Additional staff-level restrictions can be added here
        // For now, staff can see all clients (except test isolation)
    }
    
    const clients = await Client.find(filter).populate('createdBy', 'name email');
    return clients;
};

const getClientById = async (id, user) => {
    // GDPR Compliance: Access control for individual client records
    if (user.role === 'client') {
        // Clients can only access their own client record
        if (!user.clientId || user.clientId.toString() !== id) {
            throw new Error('Access denied. You can only view your own information.');
        }
    }
    
    const client = await Client.findById(id).populate('createdBy', 'name email');
    
    // Additional check for test user isolation
    if (client && user.isTestUser !== client.isTestUser) {
        throw new Error('Access denied. Test user isolation violation.');
    }
    
    return client;
};

const createClient = async (body, user) => {
    const { name, email, phone, address, dateOfBirth, notes, consultant, categoryKey } = body;

    let clientName = name;
    if (!clientName && body.firstName) {
        clientName = `${body.firstName} ${body.lastName || ''}`.trim();
    }

    let clientEmail = email;
    if (!clientEmail) {
        clientEmail = `client${Date.now()}@example.com`;
    }

    if (!clientName) {
        throw new Error('Name is a required field');
    }

    const existingClient = await Client.findOne({ email: email.toLowerCase().trim() });
    if (existingClient) {
        throw new Error('Client with this email already exists');
    }

    const clientData = {
        name: clientName.trim(),
        firstName: body.firstName ? body.firstName.trim() : '',
        lastName: body.lastName ? body.lastName.trim() : '',
        photo: body.photo || '',
        email: clientEmail.toLowerCase().trim(),
        createdBy: user?.id || '64e5f9f0e1d8f3c0a8d1f3a5',
        status: 'active',
        phone: phone ? phone.trim() : '',
        notes: notes ? notes.trim() : '',
        categoryKey: categoryKey ? categoryKey.trim() : '',
        locationAreas: body.locationAreas || []
    };

    if (dateOfBirth) {
        clientData.dateOfBirth = new Date(dateOfBirth);
    }

    clientData.address = {
        street: address && typeof address === 'object' && address.street ? address.street.trim() : '',
        city: address && typeof address === 'object' && address.city ? address.city.trim() : '',
        postcode: address && typeof address === 'object' && address.postcode ? address.postcode.trim() : '',
        country: address && typeof address === 'object' && address.country ? address.country.trim() : 'UK'
    };

    clientData.consultant = {
        name: consultant && typeof consultant === 'object' && consultant.name ? consultant.name.trim() : '',
        email: consultant && typeof consultant === 'object' && consultant.email ? consultant.email.toLowerCase().trim() : ''
    };

    const client = new Client(clientData);
    await client.save();
    return Client.findById(client._id).populate('createdBy', 'name email');
};

const updateClient = async (id, body, user) => {
    // GDPR Compliance: Access control for client updates
    if (user.role === 'client') {
        // Clients can only update their own client record
        if (!user.clientId || user.clientId.toString() !== id) {
            throw new Error('Access denied. You can only update your own information.');
        }
        
        // Restrict what fields clients can update
        const allowedFields = ['phone', 'address', 'notes'];
        const filteredBody = {};
        allowedFields.forEach(field => {
            if (body[field] !== undefined) {
                filteredBody[field] = body[field];
            }
        });
        body = filteredBody;
    }
    
    if (body.photo === '') {
        delete body.photo;
    }

    // Handle isActive virtual field
    if (typeof body.isActive !== 'undefined') {
        body.status = body.isActive ? 'active' : 'inactive';
        delete body.isActive; // Remove virtual field before updating
    }

    const client = await Client.findById(id);

    if (!client) {
        return null;
    }
    
    // Test user isolation check
    if (user.isTestUser !== client.isTestUser) {
        throw new Error('Access denied. Test user isolation violation.');
    }

    const updatedClient = await Client.findByIdAndUpdate(id, body, { new: true });

    return updatedClient;
};

const deleteClient = async (id, user) => {
    // GDPR Compliance: Only managers and superusers can delete clients
    if (!['manager', 'superuser'].includes(user.role)) {
        throw new Error('Access denied. Manager role required.');
    }
    
    // Clients cannot delete any records
    if (user.role === 'client') {
        throw new Error('Access denied. Clients cannot delete records.');
    }

    const client = await Client.findById(id);
    if (!client) {
        return null;
    }
    
    // Test user isolation check
    if (user.isTestUser !== client.isTestUser) {
        throw new Error('Access denied. Test user isolation violation.');
    }

    await Client.findByIdAndDelete(id);
    return { msg: 'Client deleted successfully' };
};

module.exports = {
    getClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
};