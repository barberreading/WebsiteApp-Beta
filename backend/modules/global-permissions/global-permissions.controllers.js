const asyncHandler = require('../../middleware/async');
const globalPermissionsService = require('./global-permissions.services');

const getGlobalPermissions = asyncHandler(async (req, res) => {
    const permissions = await globalPermissionsService.getGlobalPermissions();
    res.json(permissions);
});

const updateGlobalPermissions = asyncHandler(async (req, res) => {
    const permissions = await globalPermissionsService.updateGlobalPermissions(req.user.id, req.body);
    res.json({
        message: 'Global permissions updated successfully',
        permissions
    });
});

const getRolePermissions = asyncHandler(async (req, res) => {
    const { role } = req.params;
    const rolePermissions = await globalPermissionsService.getRolePermissions(role);
    res.json(rolePermissions);
});

const getClientTemplate = asyncHandler(async (req, res) => {
    const clientTemplate = await globalPermissionsService.getClientTemplate();
    res.json(clientTemplate);
});

const resetPermissions = asyncHandler(async (req, res) => {
    const defaultPermissions = await globalPermissionsService.resetPermissions(req.user.id);
    res.json({
        message: 'Permissions reset to defaults successfully',
        permissions: defaultPermissions
    });
});

module.exports = {
    getGlobalPermissions,
    updateGlobalPermissions,
    getRolePermissions,
    getClientTemplate,
    resetPermissions
};