const BookingAlertTemplate = require('../../models/BookingAlertTemplate');

const getBookingAlertTemplates = async () => {
  return await BookingAlertTemplate.find({ isActive: true })
    .populate('service', 'name')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
};

const getBookingAlertTemplate = async (id) => {
  const template = await BookingAlertTemplate.findById(id)
    .populate('service', 'name')
    .populate('createdBy', 'name email');

  if (!template) {
    throw new Error(`Template not found with id of ${id}`);
  }

  return template;
};

const createBookingAlertTemplate = async (templateData, userId) => {
  templateData.createdBy = userId;

  const template = await BookingAlertTemplate.create(templateData);

  return await BookingAlertTemplate.findById(template._id)
    .populate('service', 'name')
    .populate('createdBy', 'name email');
};

const updateBookingAlertTemplate = async (id, templateData) => {
  let template = await BookingAlertTemplate.findById(id);

  if (!template) {
    throw new Error(`Template not found with id of ${id}`);
  }

  return await BookingAlertTemplate.findByIdAndUpdate(id, templateData, {
    new: true,
    runValidators: true,
  })
    .populate('service', 'name')
    .populate('createdBy', 'name email');
};

const BookingAlert = require('../../models/BookingAlert');

const deleteBookingAlertTemplate = async (id) => {
  const template = await BookingAlertTemplate.findById(id);

  if (!template) {
    throw new Error(`Template not found with id of ${id}`);
  }

  await BookingAlertTemplate.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
};

const createBookingAlertFromTemplate = async (id, alertData, userId) => {
  const template = await BookingAlertTemplate.findById(id);

  if (!template) {
    throw new Error(`Template not found with id of ${id}`);
  }

  const { startTime, endTime } = alertData;

  if (!startTime || !endTime) {
    throw new Error('Start time and end time are required');
  }

  const newAlertData = {
    title: template.title,
    description: template.alertDescription,
    startTime,
    endTime,
    service: template.service,
    location: template.location,
    manager: userId,
    locationArea: template.locationArea,
    sendToAll: template.sendToAll,
    selectedLocationAreas: template.selectedLocationAreas,
    sendAsNotification: template.sendAsNotification,
    sendAsEmail: template.sendAsEmail,
  };

  const alert = await BookingAlert.create(newAlertData);

  return await BookingAlert.findById(alert._id)
    .populate('service', 'name')
    .populate('manager', 'name email');
};

module.exports = {
    getBookingAlertTemplates,
    getBookingAlertTemplate,
    createBookingAlertTemplate,
    updateBookingAlertTemplate,
    deleteBookingAlertTemplate,
    createBookingAlertFromTemplate
};