-- script de migración inicial para PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla: usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla: especies_aves
CREATE TABLE especies_aves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_cientifico VARCHAR(255) UNIQUE NOT NULL,
    nombre_comun VARCHAR(255),
    descripcion TEXT
);

-- 3. Tabla: ubicaciones
CREATE TABLE ubicaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    latitud DOUBLE PRECISION NOT NULL,
    longitud DOUBLE PRECISION NOT NULL,
    region VARCHAR(255)
);

-- 4. Tabla: audios
CREATE TABLE audios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    ubicacion_id UUID REFERENCES ubicaciones(id) ON DELETE SET NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    duracion DOUBLE PRECISION,
    fecha_grabacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla: resultados_identificacion
CREATE TABLE resultados_identificacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audio_id UUID UNIQUE REFERENCES audios(id) ON DELETE CASCADE,
    especie_id UUID REFERENCES especies_aves(id) ON DELETE SET NULL,
    confianza DOUBLE PRECISION NOT NULL,
    espectrograma TEXT,
    modelo_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices recomendados
CREATE INDEX idx_audios_usuario ON audios(usuario_id);
CREATE INDEX idx_resultados_especie ON resultados_identificacion(especie_id);
