const { Service, PREDEFINED_COLORS } = require('../../models/Service');
const ErrorResponse = require('../../utils/errorResponse');

const getServices = async (active) => {
  const filter = active !== undefined ? { isActive: active === 'true' } : {};
  return Service.find(filter).populate('createdBy', 'name email').sort({ name: 1 });
};

const getPredefinedColors = () => {
  return {
    colors: PREDEFINED_COLORS,
    colorNames: [
      'Light Pink',
      'Light Blue',
      'Light Green',
      'Light Orange',
      'Light Purple',
      'Light Yellow',
      'Light Cyan',
      'Light Rose',
      'Light Lime',
      'Light Indigo',
      'Light Coral',
      'Light Sky Blue',
    ],
  };
};

const getServiceById = async (id) => {
  const service = await Service.findById(id).populate('createdBy', 'name email');
  if (!service) {
    throw new ErrorResponse('Service not found', 404);
  }
  return service;
};

const createService = async (serviceData, userId) => {
  const { name, description, duration, category, bookingKey, locationArea } = serviceData;

  const existingService = await Service.findOne({ name: name.trim() });
  if (existingService) {
    throw new ErrorResponse('Service with this name already exists', 400);
  }

  const service = new Service({
    name: name.trim(),
    description: description?.trim(),
    duration,
    category: category?.trim(),
    bookingKey,
    locationArea,
    createdBy: userId,
  });

  await service.save();
  return Service.findById(service._id).populate('createdBy', 'name email');
};

const updateService = async (id, serviceData) => {
  const { name, description, duration, category, bookingKey, locationArea, isActive, color } = serviceData;

  const service = await Service.findById(id);
  if (!service) {
    throw new ErrorResponse('Service not found', 404);
  }

  if (name && name.trim() !== service.name) {
    const existingService = await Service.findOne({ name: name.trim(), _id: { $ne: id } });
    if (existingService) {
      throw new ErrorResponse('Service with this name already exists', 400);
    }
  }

  if (name) service.name = name.trim();
  if (description !== undefined) service.description = description?.trim();
  if (duration) service.duration = duration;
  if (category !== undefined) service.category = category?.trim();
  if (bookingKey !== undefined) service.bookingKey = bookingKey;
  if (locationArea !== undefined) service.locationArea = locationArea;
  if (isActive !== undefined) service.isActive = isActive;
  if (color !== undefined) service.color = color;

  await service.save();
  return Service.findById(service._id).populate('createdBy', 'name email');
};

const deleteService = async (id) => {
  const service = await Service.findById(id);
  if (!service) {
    throw new ErrorResponse('Service not found', 404);
  }

  await Service.findByIdAndDelete(id);
  return { msg: 'Service deleted successfully' };
};

module.exports = {
  getServices,
  getPredefinedColors,
  getServiceById,
  createService,
  updateService,
  deleteService,
};