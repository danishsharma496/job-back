CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    joined DATE DEFAULT CURRENT_DATE,
    is_admin BOOLEAN DEFAULT FALSE
);
CREATE TABLE login (
  id SERIAL PRIMARY KEY,
  hash VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
);
 
 
 
CREATE TABLE job_listing (
  id SERIAL PRIMARY KEY,
  job_title VARCHAR(100) NOT NULL,
  company_name VARCHAR(100) NOT NULL,
  location VARCHAR(100) NOT NULL,
  job_description TEXT NOT NULL,
  deadline DATE NOT NULL,
  posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  contact_phone VARCHAR(20) NOT NULL,
  contact_email VARCHAR(100) NOT NULL,
  order_index INTEGER DEFAULT 0

);

 
CREATE TABLE interested_jobs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  job_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (job_id) REFERENCES job_listing (id)
);

