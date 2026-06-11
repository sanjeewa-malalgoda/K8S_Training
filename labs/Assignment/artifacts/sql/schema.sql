CREATE DATABASE IF NOT EXISTS gov_services;
USE gov_services;

CREATE TABLE IF NOT EXISTS department (
    department_id   INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(120) NOT NULL,
    code            VARCHAR(20)  NOT NULL,
    description     VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS service_application (
    application_id   INT AUTO_INCREMENT PRIMARY KEY,
    citizen_id       VARCHAR(20)  NOT NULL,
    service_name     VARCHAR(150) NOT NULL,
    status           VARCHAR(30)  NOT NULL DEFAULT 'SUBMITTED',
    submitted_date   DATE         NOT NULL,
    department_id    INT,
    CONSTRAINT fk_department
        FOREIGN KEY (department_id) REFERENCES department(department_id)
);

INSERT INTO department (department_id, name, code, description) VALUES
    (1, 'Civil Registration', 'CIVREG', 'Birth, marriage and death certificates'),
    (2, 'Immigration',        'IMMIG',  'Passports, visas and travel documents'),
    (3, 'Revenue',            'REV',    'Tax registration and clearance')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    code = VALUES(code),
    description = VALUES(description);

INSERT INTO service_application
    (application_id, citizen_id, service_name, status, submitted_date, department_id) VALUES
    (1, '11001234567', 'Birth Certificate',     'APPROVED',  '2026-05-02', 1),
    (2, '11009876543', 'Passport Renewal',      'IN_REVIEW', '2026-05-10', 2),
    (3, '11005551212', 'Tax Clearance Letter',  'SUBMITTED', '2026-05-18', 3),
    (4, '11001234567', 'Marriage Certificate',  'SUBMITTED', '2026-05-20', 1)
ON DUPLICATE KEY UPDATE
    citizen_id = VALUES(citizen_id),
    service_name = VALUES(service_name),
    status = VALUES(status),
    submitted_date = VALUES(submitted_date),
    department_id = VALUES(department_id);
