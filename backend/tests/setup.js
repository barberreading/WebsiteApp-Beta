const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

global.beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
});

global.afterAll(async () => {
  if (mongoServer) {
    await mongoServer.stop();
  }
});