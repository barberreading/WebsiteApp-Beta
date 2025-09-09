const GlobalPermissions = require('../../models/GlobalPermissions');

const getGlobalPermissions = async () => {
    let permissions = await GlobalPermissions.findOne();
    if (!permissions) {
        permissions = new GlobalPermissions({});
        await permissions.save();
    }
    return permissions;
};

const updateGlobalPermissions = async (userId, permissionData) => {
    const {
        rolePermissions,
        defaultClientPermissions,
        settings,
        adminUserGroups,
        hrDocumentAccess,
        staffGalleryAccess
    } = permissionData;

    let permissions = await GlobalPermissions.findOne();

    if (!permissions) {
        permissions = new GlobalPermissions({
            rolePermissions,
            defaultClientPermissions,
            settings,
            adminUserGroups,
            hrDocumentAccess,
            staffGalleryAccess,
            lastUpdatedBy: userId
        });
    } else {
        permissions.rolePermissions = rolePermissions;
        permissions.defaultClientPermissions = defaultClientPermissions;
        permissions.settings = settings;

        if (adminUserGroups !== undefined) {
            permissions.adminUserGroups = adminUserGroups;
        }

        if (hrDocumentAccess !== undefined) {
            permissions.hrDocumentAccess = hrDocumentAccess;
        }

        if (staffGalleryAccess !== undefined) {
            permissions.staffGalleryAccess = staffGalleryAccess;
        }

        permissions.lastUpdatedBy = userId;
    }

    await permissions.save();
    return permissions;
};

const getRolePermissions = async (role) => {
    const permissions = await GlobalPermissions.findOne();
    if (!permissions) {
        throw new Error('Global permissions not found');
    }
    const rolePermissions = permissions.rolePermissions[role];
    if (!rolePermissions) {
        throw new Error('Role permissions not found');
    }
    return rolePermissions;
};

const getClientTemplate = async () => {
    const permissions = await GlobalPermissions.findOne();
    if (!permissions) {
        throw new Error('Global permissions not found');
    }
    return permissions.defaultClientPermissions;
};

const resetPermissions = async (userId) => {
    await GlobalPermissions.deleteMany({});
    const defaultPermissions = new GlobalPermissions({
        lastUpdatedBy: userId
    });
    await defaultPermissions.save();
    return defaultPermissions;
};

module.exports = {
    getGlobalPermissions,
    updateGlobalPermissions,
    getRolePermissions,
    getClientTemplate,
    resetPermissions
};