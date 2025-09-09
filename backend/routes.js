const fs = require('fs');
const path = require('path');

module.exports = function(app) {
    const modulesDir = path.join(__dirname, 'modules');
    fs.readdirSync(modulesDir).forEach(module => {
        const moduleDir = path.join(modulesDir, module);
        if (fs.statSync(moduleDir).isDirectory()) {
            const routesFile = path.join(moduleDir, `${module}.routes.js`);
            if (fs.existsSync(routesFile)) {
                try {
                    const route = require(routesFile);
                    app.use(`/api/${module}`, route.router || route);
                } catch (error) {
                    console.error(`Error loading route for ${module}:`, error);
                }
            }
        }
    });
};