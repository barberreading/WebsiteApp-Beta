const Client = require('../../models/Client');

const getClients = async (query) => {
    const { status, active } = query;

    let filter = {};

    if (status) {
        filter.status = status;
    } else if (active !== undefined) {
        if (active === 'true') {
            filter.status = 'active';
        } else {
            filter.status = 'inactive';
        }
    }

    return Client.find(filter)
        .populate('createdBy', 'name email')
        .sort({ name: 1 });
};

const getClientById = async (id) => {
    return Client.findById(id)
        .populate('createdBy', 'name email');
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

    const updatedClient = await Client.findByIdAndUpdate(id, body, { new: true });

    return updatedClient;
};

const deleteClient = async (id, role) => {
    if (!['manager', 'superuser'].includes(userRole)) {
        throw new Error('Access denied. Manager role required.');
    }

    const client = await Client.findById(id);
    if (!client) {
        return null;
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