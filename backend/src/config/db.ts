import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";

// Ensure .env is reliably loaded across all runtime environments (cPanel Phusion Passenger, local dev, root execution)
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Configuration credentials from .env
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = parseInt(process.env.DB_PORT || "3306", 10);
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "ecommerce";

export const isPlaceholderConfig =
  !process.env.DB_HOST ||
  process.env.DB_HOST === "your_server_ip" ||
  process.env.DB_USER === "your_db_username";

// Safe dynamic import for mysql2 to prevent crashing when package is not yet installed in node_modules
let mysqlModule: any = null;
try {
  mysqlModule = require("mysql2/promise");
} catch (e) {
  // mysql2 is not installed yet in node_modules
}

export type Pool = any;

let poolInstance: any = null;

if (mysqlModule && !isPlaceholderConfig) {
  try {
    poolInstance = mysqlModule.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      connectTimeout: 10000,
    });

    poolInstance.on?.("error", (err: any) => {
      console.warn("⚠️  [MySQL Pool Connection Event]:", err?.message || err);
    });
  } catch (err: any) {
    console.warn("⚠️  [MySQL Pool Creation Warning]:", err?.message || err);
  }
}

// Fallback pool that never throws unhandled crashes when MySQL is inactive or module is not installed
const fallbackPool: any = {
  getConnection: async () => {
    throw new Error("MySQL connection is inactive or mysql2 package is not installed.");
  },
  query: async (_sql: string, _params?: any[]) => {
    return [[], []];
  },
  on: (_event: string, _handler: any) => {},
};

export const pool: any = poolInstance || fallbackPool;

/**
 * Test Connection & Error Handling
 */
export async function testMySQLConnection(): Promise<boolean> {
  if (isPlaceholderConfig) {
    return false;
  }
  if (!mysqlModule) {
    console.warn("ℹ️  [MySQL] 'mysql2' package is not installed in node_modules.");
    console.warn("👉 To connect to remote MySQL, run: npm install mysql2");
    return false;
  }
  if (!poolInstance) {
    return false;
  }

  try {
    const connection = await poolInstance.getConnection();
    console.log(`✅ [MySQL] Connected to remote MySQL database [${DB_NAME}] on ${DB_HOST}:${DB_PORT}`);
    connection.release();
    return true;
  } catch (error: any) {
    console.error("❌ [MySQL] Connection failed:", error.message);
    if (error.code === "ECONNREFUSED") {
      console.error("👉 Please verify DB_HOST and DB_PORT, and ensure remote MySQL access is allowed in cPanel (Remote MySQL).");
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("👉 Access denied: Please verify DB_USER and DB_PASSWORD.");
    } else if (error.code === "ER_BAD_DB_ERROR") {
      console.error(`👉 Database '${DB_NAME}' does not exist on the MySQL server.`);
    }
    return false;
  }
}

/**
 * 3. Auto-Create 8 E-commerce & Inventory Tables
 */
export async function initMySQLTables(): Promise<void> {
  if (isPlaceholderConfig || !mysqlModule || !poolInstance) {
    return;
  }
  const isConnected = await testMySQLConnection();
  if (!isConnected) {
    return;
  }

  console.log("🛠️  [MySQL] Checking and auto-creating required E-commerce & Inventory tables...");

  const queries = [
    // 1. users (with admin/customer roles)
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      role ENUM('admin', 'customer', 'SuperAdmin', 'Manager') DEFAULT 'customer',
      status VARCHAR(50) DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_email (email),
      INDEX idx_user_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 2. categories
    `CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      slug VARCHAR(255) NOT NULL UNIQUE,
      image_url TEXT,
      parent_id VARCHAR(36) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
      INDEX idx_cat_slug (slug),
      INDEX idx_cat_parent (parent_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 3. products (including sku, price, stock_quantity, low_stock_threshold, and image_url)
    `CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      sku VARCHAR(100) UNIQUE NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      stock_quantity INT NOT NULL DEFAULT 0,
      low_stock_threshold INT NOT NULL DEFAULT 5,
      image_url TEXT,
      category_id VARCHAR(36) NULL,
      description TEXT,
      status ENUM('active', 'inactive', 'archived') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      INDEX idx_product_sku (sku),
      INDEX idx_product_stock (stock_quantity),
      INDEX idx_product_category (category_id),
      INDEX idx_product_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 4. inventory_logs (tracking product_id, change_type like 'restock', 'sale', 'return', 'adjustment', quantity_changed, note, and created_at)
    `CREATE TABLE IF NOT EXISTS inventory_logs (
      id VARCHAR(36) PRIMARY KEY,
      product_id VARCHAR(36) NOT NULL,
      change_type ENUM('restock', 'sale', 'return', 'adjustment') NOT NULL,
      quantity_changed INT NOT NULL,
      note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      INDEX idx_inv_product (product_id),
      INDEX idx_inv_type (change_type),
      INDEX idx_inv_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 5. cart
    `CREATE TABLE IF NOT EXISTS cart (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NULL,
      product_id VARCHAR(36) NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      INDEX idx_cart_user (user_id),
      INDEX idx_cart_product (product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 6. orders (with shipping address and order status)
    `CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(36) PRIMARY KEY,
      order_number VARCHAR(100) UNIQUE NOT NULL,
      user_id VARCHAR(36) NULL,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50) NOT NULL,
      customer_email VARCHAR(255) NULL,
      shipping_address TEXT NOT NULL,
      total_amount DECIMAL(10, 2) NOT NULL,
      order_status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_order_number (order_number),
      INDEX idx_order_status (order_status),
      INDEX idx_order_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 7. order_items
    `CREATE TABLE IF NOT EXISTS order_items (
      id VARCHAR(36) PRIMARY KEY,
      order_id VARCHAR(36) NOT NULL,
      product_id VARCHAR(36) NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      quantity INT NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      total DECIMAL(10, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      INDEX idx_order_items_order (order_id),
      INDEX idx_order_items_product (product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 8. payments (supporting Cash on Delivery and mobile banking/card)
    `CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(36) PRIMARY KEY,
      order_id VARCHAR(36) NOT NULL,
      payment_method ENUM('Cash on Delivery', 'bKash', 'Nagad', 'Rocket', 'Card', 'COD') DEFAULT 'Cash on Delivery',
      payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
      transaction_id VARCHAR(255) NULL,
      amount DECIMAL(10, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      INDEX idx_payment_order (order_id),
      INDEX idx_payment_status (payment_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  ];

  try {
    for (const sql of queries) {
      await pool.query(sql);
    }
    console.log("✅ [MySQL] All 8 E-commerce & Inventory tables verified / initialized successfully.");

    // Ensure Default SuperAdmin user exists in MySQL users table
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@glowgoodly.com").trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    try {
      const [rows] = await pool.query("SELECT id FROM users WHERE email = ? LIMIT 1", [adminEmail]);
      if (Array.isArray(rows) && rows.length === 0) {
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        const adminId = "admin-super-" + Date.now();
        await pool.query(
          "INSERT INTO users (id, name, email, password_hash, role, status) VALUES (?, ?, ?, ?, 'SuperAdmin', 'Active')",
          [adminId, "GlowGoodly SuperAdmin", adminEmail, passwordHash]
        );
        console.log(`🌱 [MySQL] Default SuperAdmin account verified/created: [${adminEmail}]`);
      }
    } catch (seedErr: any) {
      console.warn("ℹ️  [MySQL] SuperAdmin verification note:", seedErr.message);
    }
  } catch (err: any) {
    console.error("❌ [MySQL] Error initializing tables:", err.message);
  }
}

