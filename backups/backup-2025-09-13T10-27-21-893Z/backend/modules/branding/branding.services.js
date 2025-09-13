const BrandingConfig = require('../../models/BrandingConfig');

exports.getBranding = async () => {
  let branding = await BrandingConfig.findOne();
  if (!branding) {
    branding = await BrandingConfig.create({});
  }
  return branding;
};

exports.updateBranding = async (data) => {
  const {
    companyName,
    logo,
    primaryColor,
    secondaryColor,
    emailHeader,
    emailFooter,
    emailSignature,
    favicon
  } = data;

  let branding = await BrandingConfig.findOne();
  if (!branding) {
    branding = new BrandingConfig({});
  }

  if (companyName) branding.companyName = companyName;
  if (logo) branding.logo = logo;
  if (primaryColor) branding.primaryColor = primaryColor;
  if (secondaryColor) branding.secondaryColor = secondaryColor;
  if (emailHeader !== undefined) branding.emailHeader = emailHeader;
  if (emailFooter !== undefined) branding.emailFooter = emailFooter;
  if (emailSignature) branding.emailSignature = emailSignature;
  if (favicon) branding.favicon = favicon;

  await branding.save();
  return branding;
};

exports.uploadLogo = async (logoData) => {
  if (!logoData) {
    throw new Error('No logo data provided');
  }

  let branding = await BrandingConfig.findOne();
  if (!branding) {
    branding = new BrandingConfig({});
  }

  branding.logo = logoData;
  await branding.save();
  return branding.logo;
};