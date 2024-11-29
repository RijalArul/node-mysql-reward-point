const connection = require('./db')

const createDatabaseAndTables = async () => {
  try {
    await connection
      .promise()
      .query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`)
    console.log(
      `Database '${process.env.DB_NAME}' dropped successfully (if it existed).`
    )

    await connection.promise().query(`CREATE DATABASE ${process.env.DB_NAME}`)
    console.log(`Database '${process.env.DB_NAME}' created successfully.`)

    await connection.promise().query(`USE ${process.env.DB_NAME}`)

    await connection.promise().query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        total_reward_points INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `)

    await connection.promise().query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        status ENUM('Pending', 'Delivered', 'Cancelled') DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      );
    `)

    await connection.promise().query(`
      CREATE TABLE IF NOT EXISTS reward_points (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        order_id INT NOT NULL,
        points INT NOT NULL,
        expiry_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
    `)

    await connection.promise().query(`
      INSERT INTO customers (name, total_reward_points) VALUES 
      ('Alice', 0),
      ('Bob', 100),
      ('Charlie', 200);
    `)
    console.log('Insert data inserted into customers.')

    await connection.promise().query(`
      INSERT INTO orders (customer_id, total_amount, currency, status) VALUES
      (1, 100.00, 'USD', 'Delivered'),
      (2, 250.00, 'USD', 'Pending'),
      (3, 300.00, 'USD', 'Cancelled'),
      (1, 50.00, 'USD', 'Delivered'),
      (2, 75.00, 'EUR', 'Delivered');
    `)
    console.log('Insert data inserted into orders.')
  } catch (err) {
    console.error('Error creating database or tables:', err.message)
  } finally {
    connection.end()
  }
}

createDatabaseAndTables()
