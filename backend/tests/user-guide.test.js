const fs = require('fs');
const path = require('path');
const { getUserGuide, updateUserGuide } = require('../modules/user-guide/user-guide.services');

const userGuidePath = path.join(__dirname, '../../frontend/public/user_guide.html');

describe('User Guide Module', () => {
    beforeEach(() => {
        // Create a dummy user guide file
        fs.writeFileSync(userGuidePath, '<h1>User Guide</h1>');
    });

    afterEach(() => {
        // Clean up the dummy file
        fs.unlinkSync(userGuidePath);
    });

    it('should get the user guide content', async () => {
        const content = await getUserGuide();
        expect(content).toBe('<h1>User Guide</h1>');
    });

    it('should update the user guide content', async () => {
        const newContent = '<h2>New Content</h2>';
        await updateUserGuide(newContent);
        const content = fs.readFileSync(userGuidePath, 'utf8');
        expect(content).toBe(newContent);
    });
});