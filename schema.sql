-- Base de Datos para Sistema de Gestión de Reservas del Centro Deportivo
CREATE DATABASE IF NOT EXISTS centro_deportivo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE centro_deportivo;

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    rol ENUM('CLIENTE', 'ENCARGADO', 'ADMINISTRADOR') DEFAULT 'CLIENTE',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Instalaciones
CREATE TABLE IF NOT EXISTS instalaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    deporte ENUM('fútbol', 'vóley', 'básquet', 'entrenamiento') NOT NULL,
    descripcion TEXT,
    precio_por_hora DECIMAL(10,2) NOT NULL,
    estado ENUM('activa', 'mantenimiento') DEFAULT 'activa'
);

-- Tabla de Horarios de Atención del Centro
CREATE TABLE IF NOT EXISTS horarios_atencion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dia_semana TINYINT NOT NULL COMMENT '0=Domingo, 1=Lunes, ..., 6=Sábado',
    hora_apertura TIME NOT NULL,
    hora_cierre TIME NOT NULL
);

-- Tabla de Reservas
CREATE TABLE IF NOT EXISTS reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    instalacion_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado ENUM('confirmada', 'cancelada', 'completada') DEFAULT 'confirmada',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (instalacion_id) REFERENCES instalaciones(id) ON DELETE CASCADE
);

-- Datos Semilla (Iniciales)
INSERT INTO instalaciones (nombre, deporte, descripcion, precio_por_hora) VALUES
('Cancha Sintética 1', 'fútbol', 'Fútbol 7 con césped sintético e iluminación LED', 60.00),
('Cancha Sintética 2', 'fútbol', 'Fútbol 5 techada', 50.00),
('Coliseo Vóley A', 'vóley', 'Piso parquet profesional', 40.00),
('Cancha Básquet Exterior', 'básquet', 'Aro reglamentario', 35.00),
('Zona Funcional Gym', 'entrenamiento', 'Espacio equipado para crossfit y cardio', 30.00);

-- Horario de atención: Lunes a Domingo de 08:00 a 23:00
INSERT INTO horarios_atencion (dia_semana, hora_apertura, hora_cierre) VALUES
(0, '08:00:00', '23:00:00'),
(1, '08:00:00', '23:00:00'),
(2, '08:00:00', '23:00:00'),
(3, '08:00:00', '23:00:00'),
(4, '08:00:00', '23:00:00'),
(5, '08:00:00', '23:00:00'),
(6, '08:00:00', '23:00:00');

-- Usuario Administrador por defecto (Password: admin123)
INSERT INTO usuarios (nombre, email, telefono, password, rol) VALUES
('Administrador General', 'admin@deportivo.com', '999888777', '$2b$10$wT5H/B6c3R/sWwPqC8N6Uu0Y0v9M4v3kE2mJ8kPqM3V6r7X8y9Z2S', 'ADMINISTRADOR'),
('Encargado Turno', 'encargado@deportivo.com', '988777666', '$2b$10$wT5H/B6c3R/sWwPqC8N6Uu0Y0v9M4v3kE2mJ8kPqM3V6r7X8y9Z2S', 'ENCARGADO');