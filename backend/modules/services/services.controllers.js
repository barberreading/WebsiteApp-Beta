const serviceService = require('./services.services');
const asyncHandler = require('../../middleware/async');

const getServices = asyncHandler(async (req, res, next) => {
  const { active } = req.query;
  const services = await serviceService.getServices(active);
  res.json(services);
});

const getPredefinedColors = asyncHandler(async (req, res, next) => {
  const colors = serviceService.getPredefinedColors();
  res.json(colors);
});

const getServiceById = asyncHandler(async (req, res, next) => {
  const service = await serviceService.getServiceById(req.params.id);
  res.json(service);
});

const createService = asyncHandler(async (req, res, next) => {
  const service = await serviceService.createService(req.body, req.user.id);
  res.status(201).json(service);
});

const updateService = asyncHandler(async (req, res, next) => {
  const service = await serviceService.updateService(req.params.id, req.body);
  res.json(service);
});

const deleteService = asyncHandler(async (req, res, next) => {
  const result = await serviceService.deleteService(req.params.id);
  res.json(result);
});

module.exports = {
  getServices,
  getPredefinedColors,
  getServiceById,
  createService,
  updateService,
  deleteService,
};