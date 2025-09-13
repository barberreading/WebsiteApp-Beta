const asyncHandler = require('../../middleware/async');
const clientService = require('./clients.services');

const getClients = asyncHandler(async (req, res) => {
    const clients = await clientService.getClients(req.user);
    res.json(clients);
});

const getClientById = asyncHandler(async (req, res) => {
    const client = await clientService.getClientById(req.params.id, req.user);
    if (!client) {
        return res.status(404).json({ msg: 'Client not found' });
    }
    res.json(client);
});

const createClient = asyncHandler(async (req, res) => {
    const client = await clientService.createClient(req.body, req.user);
    res.status(201).json(client);
});

const updateClient = asyncHandler(async (req, res) => {
    const updatedClient = await clientService.updateClient(req.params.id, req.body, req.user);
    if (!updatedClient) {
        return res.status(404).json({ message: 'Client not found' });
    }
    res.json(updatedClient);
});

const deleteClient = asyncHandler(async (req, res) => {
    const result = await clientService.deleteClient(req.params.id, req.user);
    if (!result) {
        return res.status(404).json({ msg: 'Client not found' });
    }
    res.json(result);
});

module.exports = {
    getClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
};