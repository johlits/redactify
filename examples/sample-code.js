// Sample code with secrets and business logic to test redaction
// NOTE: All secrets below are FAKE examples for demonstration purposes only

// API Configuration
const config = {
  api_key: "sk_live_EXAMPLE_KEY_1234567890abcdefghijklmnopqrstuvwxyz",
  secret_key: "whsec_EXAMPLE_SECRET_1234567890abcdef",
  stripe_api_key: "sk_test_EXAMPLE_TEST_KEY_abcdef123456",
  aws_access_key_id: "AKIA_EXAMPLE_KEY_12345",
  aws_secret_access_key: "EXAMPLE_AWS_SECRET_KEY_abcdefghijklmnop"
};

// Database connection
const dbUrl = "mongodb://admin:MySecretPassword123@cluster0.mongodb.net/mycompany_db";

// Customer management
class CustomerManager {
  constructor() {
    this.customerDatabase = [];
    this.invoiceSystem = null;
    this.paymentProcessor = null;
  }

  async createCustomer(customerName, customerEmail, customerPhone) {
    const customer = {
      id: this.generateCustomerId(),
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      companyName: "Acme Corp",
      subscriptionTier: "premium"
    };
    
    this.customerDatabase.push(customer);
    return customer;
  }

  async processPayment(customerId, amount) {
    // Process payment through our payment gateway
    const response = await fetch("https://api.payment-gateway.com/charge", {
      method: "POST",
      headers: {
        "Authorization": "Bearer EXAMPLE_TOKEN_abc123xyz789",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        customer_id: customerId,
        amount: amount,
        currency: "USD"
      })
    });
    
    return response.json();
  }

  generateCustomerId() {
    return `CUST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Email service
const emailConfig = {
  smtp_host: "smtp.gmail.com",
  smtp_user: "support@mycompany.com",
  smtp_password: "MyEmailPassword456!",
  from_email: "noreply@mycompany.com"
};

// JWT Secret
const JWT_SECRET = "super-secret-jwt-key-do-not-share-2024";

// Private key for encryption
const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAy8Dbv8prpJ/0kKhlGeJYozo2t60EG8L0561g13R29LvMR5hy
vGZlGJpmn65+A4xHXInJYiPuKzrKUnApeLZ+vw1HocOAZtWK0z3r26uA8kQYOKX9
-----END RSA PRIVATE KEY-----`;

// Export configuration
export { config, CustomerManager, emailConfig, JWT_SECRET };
