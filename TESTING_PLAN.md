# 🧪 Plan de Implementación de Tests - StreamX

## 📋 Estado Actual

**Cobertura de tests**: 0% ❌

El proyecto no cuenta con ningún sistema de pruebas automatizadas implementado.

---

## 🎯 Objetivos

1. **Corto Plazo (1-2 semanas)**: 40% de cobertura
2. **Mediano Plazo (1 mes)**: 70% de cobertura
3. **Largo Plazo (3 meses)**: 90%+ de cobertura

---

## 🛠️ Stack de Testing Propuesto

### Dependencias a Instalar

```bash
npm install --save-dev jest supertest mongodb-memory-server @shelf/jest-mongodb
```

### Herramientas

| Herramienta | Propósito |
|-------------|-----------|
| **Jest** | Framework de testing principal |
| **Supertest** | Testing de endpoints HTTP |
| **MongoDB Memory Server** | DB en memoria para tests |
| **eslint-plugin-jest** | Linting para tests |

---

## 📁 Estructura de Tests Propuesta

```
/workspace/
├── tests/
│   ├── setup.js               # Configuración global
│   ├── teardown.js            # Limpieza post-tests
│   ├── unit/                  # Tests unitarios
│   │   ├── controllers/
│   │   │   ├── auth.test.js
│   │   │   ├── movie.test.js
│   │   │   └── admin.test.js
│   │   ├── models/
│   │   │   ├── Movie.test.js
│   │   │   ├── Series.test.js
│   │   │   └── AdminUser.test.js
│   │   └── middleware/
│   │       ├── auth.test.js
│   │       └── errorHandler.test.js
│   ├── integration/           # Tests de integración
│   │   ├── api/
│   │   │   ├── movies.test.js
│   │   │   ├── series.test.js
│   │   │   └── tv.test.js
│   │   ├── admin/
│   │   │   ├── login.test.js
│   │   │   └── dashboard.test.js
│   │   └── web/
│   │       ├── homepage.test.js
│   │       └── watch.test.js
│   └── e2e/                   # Tests end-to-end
│       ├── critical-paths.test.js
│       └── user-flows.test.js
├── jest.config.js             # Configuración Jest
└── package.json               # Scripts actualizados
```

---

## 📝 Plan de Implementación por Fases

### Fase 1: Configuración (2-3 horas)

#### 1.1 Instalar Dependencias
```bash
npm install --save-dev jest supertest mongodb-memory-server
```

#### 1.2 Configurar Jest (`jest.config.js`)
```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'app.js',
    'routes/**/*.js',
    'controllers/**/*.js',
    'models/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30
    }
  },
  testTimeout: 10000,
  maxWorkers: 4,
  verbose: true,
  testMatch: ['**/tests/**/*.test.js']
};
```

#### 1.3 Setup de Tests (`tests/setup.js`)
```javascript
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
```

#### 1.4 Actualizar package.json
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "jest tests/e2e"
  }
}
```

---

### Fase 2: Tests Unitarios (8-10 horas)

#### 2.1 Tests de Modelos (3-4 horas)

**Ejemplo: `tests/unit/models/Movie.test.js`**
```javascript
const Movie = require('../../../models/Movie');

describe('Movie Model', () => {
  it('should create a valid movie', async () => {
    const movieData = {
      tmdbId: '12345',
      title: 'Test Movie',
      overview: 'Test description',
      posterPath: '/path.jpg',
      backdropPath: '/backdrop.jpg',
      releaseDate: '2024-01-01',
      genres: ['Action', 'Drama'],
      active: true
    };
    
    const movie = new Movie(movieData);
    const saved = await movie.save();
    
    expect(saved._id).toBeDefined();
    expect(saved.title).toBe('Test Movie');
    expect(saved.active).toBe(true);
  });

  it('should require title', async () => {
    const movie = new Movie({ tmdbId: '123' });
    
    await expect(movie.save()).rejects.toThrow();
  });

  it('should set default viewCount to 0', async () => {
    const movie = new Movie({
      tmdbId: '123',
      title: 'Test'
    });
    const saved = await movie.save();
    
    expect(saved.viewCount).toBe(0);
  });
});
```

#### 2.2 Tests de Controladores (4-5 horas)

**Ejemplo: `tests/unit/controllers/auth.test.js`**
```javascript
const bcrypt = require('bcryptjs');
const AdminUser = require('../../../models/AdminUser');

describe('Auth Controller', () => {
  beforeEach(async () => {
    await AdminUser.deleteMany({});
  });

  it('should hash password correctly', async () => {
    const password = 'securePassword123';
    const hash = await bcrypt.hash(password, 12);
    
    expect(hash).not.toBe(password);
    expect(await bcrypt.compare(password, hash)).toBe(true);
  });

  it('should create admin user with hashed password', async () => {
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 12);
    
    const admin = await AdminUser.create({
      username: 'testadmin',
      passwordHash: hash,
      role: 'super'
    });
    
    expect(admin.username).toBe('testadmin');
    expect(admin.role).toBe('super');
  });
});
```

#### 2.3 Tests de Middleware (1-2 horas)

**Ejemplo: `tests/unit/middleware/errorHandler.test.js`**
```javascript
const { errorHandler, notFoundHandler } = require('../../../middleware');

describe('Error Handler Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      render: jest.fn()
    };
    mockNext = jest.fn();
  });

  it('should handle 404 with correct response', () => {
    notFoundHandler(mockReq, mockRes, mockNext);
    
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.render).toHaveBeenCalledWith('error', expect.any(Object));
  });

  it('should handle error with stack in development', () => {
    const error = new Error('Test error');
    process.env.NODE_ENV = 'development';
    
    errorHandler(error, mockReq, mockRes, mockNext);
    
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
});
```

---

### Fase 3: Tests de Integración (10-12 horas)

#### 3.1 Tests de API REST (5-6 horas)

**Ejemplo: `tests/integration/api/movies.test.js`**
```javascript
const request = require('supertest');
const app = require('../../../app');
const Movie = require('../../../models/Movie');

describe('Movies API', () => {
  beforeEach(async () => {
    await Movie.deleteMany({});
    await Movie.insertMany([
      { tmdbId: '1', title: 'Movie 1', active: true },
      { tmdbId: '2', title: 'Movie 2', active: true },
      { tmdbId: '3', title: 'Movie 3', active: false }
    ]);
  });

  describe('GET /api/movies', () => {
    it('should return paginated movies', async () => {
      const res = await request(app)
        .get('/api/movies?page=1&limit=2')
        .expect(200);
      
      expect(res.body.length).toBe(2);
      expect(res.body[0]).toHaveProperty('title');
      expect(res.body[0]).toHaveProperty('streamingUrl');
    });

    it('should only return active movies', async () => {
      const res = await request(app)
        .get('/api/movies')
        .expect(200);
      
      res.body.forEach(movie => {
        expect(movie.active).toBe(true);
      });
    });

    it('should handle pagination correctly', async () => {
      const res1 = await request(app)
        .get('/api/movies?page=1&limit=1')
        .expect(200);
      
      const res2 = await request(app)
        .get('/api/movies?page=2&limit=1')
        .expect(200);
      
      expect(res1.body[0]._id).not.toBe(res2.body[0]._id);
    });
  });
});
```

#### 3.2 Tests de Web/EJS (3-4 horas)

**Ejemplo: `tests/integration/web/homepage.test.js`**
```javascript
const request = require('supertest');
const app = require('../../../app');
const Movie = require('../../../models/Movie');

describe('Homepage', () => {
  beforeEach(async () => {
    await Movie.deleteMany({});
    await Movie.insertMany([
      { tmdbId: '1', title: 'Featured Movie', active: true, featured: true }
    ]);
  });

  it('should render homepage successfully', async () => {
    const res = await request(app)
      .get('/')
      .expect(200);
    
    expect(res.text).toContain('StreamX');
    expect(res.text).toContain('Featured Movie');
  });

  it('should include navigation elements', async () => {
    const res = await request(app)
      .get('/')
      .expect(200);
    
    expect(res.text).toContain('Películas');
    expect(res.text).toContain('Series');
    expect(res.text).toContain('TV en Vivo');
  });
});
```

#### 3.3 Tests de Panel Admin (2-3 horas)

**Ejemplo: `tests/integration/admin/login.test.js`**
```javascript
const request = require('supertest');
const app = require('../../../app');
const bcrypt = require('bcryptjs');
const AdminUser = require('../../../models/AdminUser');

describe('Admin Login', () => {
  beforeEach(async () => {
    await AdminUser.deleteMany({});
    const hash = await bcrypt.hash('password123', 12);
    await AdminUser.create({
      username: 'admin',
      passwordHash: hash,
      role: 'super'
    });
  });

  it('should login with correct credentials', async () => {
    const res = await request(app)
      .post('/admin/login')
      .send({ username: 'admin', password: 'password123' })
      .expect(302); // Redirect after login
    
    expect(res.headers.location).toBe('/admin/dashboard');
  });

  it('should reject incorrect password', async () => {
    const res = await request(app)
      .post('/admin/login')
      .send({ username: 'admin', password: 'wrongpassword' })
      .expect(302);
    
    expect(res.headers.location).toContain('error');
  });

  it('should reject non-existent user', async () => {
    const res = await request(app)
      .post('/admin/login')
      .send({ username: 'nonexistent', password: 'password123' })
      .expect(302);
    
    expect(res.headers.location).toContain('error');
  });
});
```

---

### Fase 4: Tests End-to-End (6-8 horas)

#### 4.1 Critical Paths (3-4 horas)

**Ejemplo: `tests/e2e/critical-paths.test.js`**
```javascript
const request = require('supertest');
const app = require('../../app');

describe('Critical User Paths', () => {
  it('complete movie watching flow', async () => {
    // 1. Visit homepage
    const homeRes = await request(app).get('/').expect(200);
    
    // 2. Navigate to movies section
    const moviesRes = await request(app).get('/').expect(200);
    
    // 3. Access watch page
    // (Assuming we have a movie with id 'test123')
    const watchRes = await request(app)
      .get('/watch/movie/test123')
      .expect(200);
    
    expect(watchRes.text).toContain('video');
    expect(watchRes.text).toContain('player');
  });

  it('TV live streaming access', async () => {
    const tvRes = await request(app).get('/tv').expect(200);
    
    expect(tvRes.text).toContain('HLS');
    expect(tvRes.text).toContain('canales');
  });
});
```

---

## 📊 Métricas y Reportes

### Configuración de Cobertura

Agregar a `jest.config.js`:
```javascript
coverageReporters: ['text', 'lcov', 'html'],
coveragePathIgnorePatterns: ['/node_modules/', '/tests/']
```

### Ver Reportes

```bash
# Texto en consola
npm test -- --coverage

# HTML interactivo
npm run test:coverage
open coverage/index.html
```

### Metas por Tipo de Test

| Tipo | Cantidad Mínima | Prioridad |
|------|----------------|-----------|
| Unitarios | 50+ | Alta |
| Integración | 30+ | Alta |
| E2E | 10+ | Media |
| **Total** | **90+** | - |

---

## 🚀 Ejecución de Tests

### Comandos Disponibles

```bash
# Todos los tests
npm test

# Modo watch (desarrollo)
npm run test:watch

# Con reporte de cobertura
npm run test:coverage

# Solo unitarios
npm run test:unit

# Solo integración
npm run test:integration

# Solo E2E
npm run test:e2e

# Test específico
npm test -- movie.test.js

# Con verbose output
npm test -- --verbose
```

---

## ✅ Checklist de Implementación

### Fase 1: Configuración
- [ ] Instalar Jest y dependencias
- [ ] Crear jest.config.js
- [ ] Configurar setup/teardown
- [ ] Actualizar package.json
- [ ] Test de humo: `npm test`

### Fase 2: Tests Unitarios
- [ ] Tests de modelos (Movie, Series, AdminUser)
- [ ] Tests de controladores (auth, movie, admin)
- [ ] Tests de middleware (errorHandler, auth)
- [ ] Alcanzar 30% cobertura

### Fase 3: Tests de Integración
- [ ] Tests de API (/api/movies, /api/series)
- [ ] Tests de Web (/, /tv, /watch)
- [ ] Tests de Admin (login, dashboard)
- [ ] Alcanzar 60% cobertura

### Fase 4: Tests E2E
- [ ] Critical paths (movie flow, TV flow)
- [ ] User flows completos
- [ ] Alcanzar 70% cobertura

### Fase 5: CI/CD
- [ ] Configurar GitHub Actions
- [ ] Tests automáticos en PR
- [ ] Badge de cobertura en README
- [ ] Alcanzar 80% cobertura

---

## 🔧 GitHub Actions Integration

Crear `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run test:coverage
    
    - name: Upload coverage
      uses: codecov/codecov-action@v2
      with:
        file: ./coverage/lcov.info
```

---

## 📈 Monitoreo de Progreso

| Semana | Cobertura | Tests | Estado |
|--------|-----------|-------|--------|
| 1 | 0-20% | 0-20 | En progreso |
| 2 | 20-40% | 20-40 | Pendiente |
| 3 | 40-60% | 40-60 | Pendiente |
| 4 | 60-80% | 60-80 | Pendiente |
| 5 | 80-90% | 80-90 | Pendiente |
| 6 | 90%+ | 90+ | Mantenimiento |

---

## ⚠️ Mejores Prácticas

1. **Nombres Descriptivos**: `it('should return 404 when movie not found')`
2. **AAA Pattern**: Arrange, Act, Assert
3. **Tests Independientes**: Sin dependencias entre tests
4. **Mocks Externos**: APIs externas, filesystem, etc.
5. **Cleanup**: Limpiar DB después de cada test
6. **CI/CD**: Ejecutar en cada commit/PR

---

## 📞 Recursos Útiles

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest GitHub](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
- [Testing Best Practices](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/testingandquality/tests.md)

---

**Documento creado**: Diciembre 2024
**Estado**: Pendiente de implementación
**Prioridad**: Alta
**Estimado Total**: 26-33 horas
