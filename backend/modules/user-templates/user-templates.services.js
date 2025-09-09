const UserTemplate = require('../../models/UserTemplate');

exports.getAllTemplates = async () => {
  return await UserTemplate.find();
};

exports.createTemplate = async (templateData) => {
  return await UserTemplate.create(templateData);
};

exports.getTemplateById = async (id) => {
  return await UserTemplate.findById(id);
};

exports.updateTemplate = async (id, templateData) => {
  return await UserTemplate.findByIdAndUpdate(id, templateData, {
    new: true,
    runValidators: true,
  });
};

exports.deleteTemplate = async (id) => {
  return await UserTemplate.findByIdAndDelete(id);
};