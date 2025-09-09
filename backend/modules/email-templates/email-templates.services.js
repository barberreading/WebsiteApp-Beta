const EmailTemplate = require('../../models/EmailTemplate');

const getEmailTemplates = async () => {
  const templates = await EmailTemplate.find().sort({ name: 1 });
  return templates;
};

const getEmailTemplateById = async (id) => {
  const template = await EmailTemplate.findById(id);
  if (!template) {
    throw new Error('Template not found');
  }
  return template;
};

const createEmailTemplate = async (templateData, userId) => {
  const { name, description, subject, body, type, variables } = templateData;

  if (!name || !subject || !body || !type) {
    throw new Error('Name, subject, body and type are required');
  }

  const existingTemplate = await EmailTemplate.findOne({ name });
  if (existingTemplate) {
    throw new Error('Template with this name already exists');
  }

  const template = new EmailTemplate({
    name,
    description: description || '',
    subject,
    body,
    type,
    variables: variables || [],
    updatedBy: userId,
  });

  await template.save();
  return template;
};

const updateEmailTemplate = async (id, templateData, userId) => {
  const { name, description, subject, body, type, variables } = templateData;

  if (!name || !description || !subject || !body || !type) {
    throw new Error('All fields are required');
  }

  let template = await EmailTemplate.findById(id);
  if (!template) {
    throw new Error('Template not found');
  }

  if (name !== template.name) {
    const existingTemplate = await EmailTemplate.findOne({ name });
    if (existingTemplate) {
      throw new Error('Template with this name already exists');
    }
  }

  template.name = name;
  template.description = description;
  template.subject = subject;
  template.body = body;
  template.type = type;
  template.variables = variables || template.variables;
  template.lastUpdated = Date.now();
  template.updatedBy = userId;

  await template.save();
  return template;
};

const deleteEmailTemplate = async (id) => {
  const template = await EmailTemplate.findById(id);
  if (!template) {
    throw new Error('Template not found');
  }
  await template.remove();
};

module.exports = {
  getEmailTemplates,
  getEmailTemplateById,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
};