// Comprehensive example demonstrating all redaction features
// NOTE: All secrets below are FAKE examples for demonstration purposes only

// API Configuration with secrets
const apiConfig = {
  api_key: "sk_live_EXAMPLE_KEY_1234567890abcdefghijklmnopqrstuvwxyz",
  secret_key: "whsec_EXAMPLE_SECRET_1234567890abcdef",
  stripe_api_key: "sk_test_EXAMPLE_TEST_KEY_abcdef123456",
  aws_access_key_id: "AKIA_EXAMPLE_KEY_12345",
  aws_secret_access_key: "EXAMPLE_AWS_SECRET_KEY_abcdefghijklmnop",
  jwt_secret: "EXAMPLE_JWT_SECRET_KEY_2024",
  database_url: "mongodb://admin:EXAMPLE_PASSWORD_123@cluster0.mongodb.net/production_db"
};

// Business-specific URLs
const API_BASE_URL = "https://api.mycompany.com/v1";
const PAYMENT_ENDPOINT = "https://payments.mycompany.com/process";
const WEBHOOK_URL = "https://webhooks.mycompany.com/stripe?key=secret123";

// Customer Management Class
class CustomerManager {
  constructor(databaseConnection, paymentProcessor) {
    this.dbConnection = databaseConnection;
    this.paymentService = paymentProcessor;
    this.customerCache = new Map();
    this.activeSubscriptions = [];
  }

  // Create a new customer account
  async createCustomerAccount(firstName, lastName, emailAddress, phoneNumber) {
    const customerId = this.generateUniqueId();
    const customerData = {
      id: customerId,
      firstName: firstName,
      lastName: lastName,
      email: emailAddress,
      phone: phoneNumber,
      companyName: "Acme Corporation",
      accountTier: "premium",
      createdAt: new Date(),
      billingAddress: {
        street: "123 Main Street",
        city: "San Francisco",
        state: "CA",
        zipCode: "94105"
      }
    };

    await this.dbConnection.insert('customers', customerData);
    this.customerCache.set(customerId, customerData);
    return customerData;
  }

  // Process payment for customer
  async processCustomerPayment(customerId, paymentAmount, paymentMethod) {
    const customer = await this.getCustomerById(customerId);
    
    const paymentRequest = {
      customer_id: customerId,
      amount: paymentAmount,
      currency: "USD",
      method: paymentMethod,
      description: "Monthly subscription payment"
    };

    const response = await fetch(PAYMENT_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiConfig.api_key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(paymentRequest)
    });

    return response.json();
  }

  // Get customer by ID
  async getCustomerById(customerId) {
    if (this.customerCache.has(customerId)) {
      return this.customerCache.get(customerId);
    }
    
    const customer = await this.dbConnection.findOne('customers', { id: customerId });
    this.customerCache.set(customerId, customer);
    return customer;
  }

  // Generate unique customer ID
  generateUniqueId() {
    return `CUST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Send welcome email to customer
  async sendWelcomeEmail(customerEmail, customerName) {
    const emailTemplate = `
      Dear ${customerName},
      
      Welcome to Acme Corporation! We're excited to have you as a customer.
      Your account has been successfully created.
      
      Best regards,
      The Acme Team
    `;

    await this.emailService.send({
      to: customerEmail,
      from: "noreply@mycompany.com",
      subject: "Welcome to Acme Corporation",
      body: emailTemplate
    });
  }
}

// Invoice Processing Class
class InvoiceProcessor {
  constructor(taxCalculator, paymentGateway) {
    this.taxCalc = taxCalculator;
    this.gateway = paymentGateway;
    this.invoiceCounter = 1000;
  }

  // Generate invoice for customer order
  generateInvoice(orderDetails, customerInfo) {
    const invoiceNumber = `INV-${this.invoiceCounter++}`;
    const subtotal = this.calculateSubtotal(orderDetails.items);
    const taxAmount = this.taxCalc.calculate(subtotal, customerInfo.state);
    const totalAmount = subtotal + taxAmount;

    const invoice = {
      invoiceNumber: invoiceNumber,
      customerId: customerInfo.id,
      customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
      companyName: customerInfo.companyName,
      items: orderDetails.items,
      subtotal: subtotal,
      tax: taxAmount,
      total: totalAmount,
      dueDate: this.calculateDueDate(),
      paymentTerms: "Net 30"
    };

    return invoice;
  }

  // Calculate subtotal from order items
  calculateSubtotal(orderItems) {
    return orderItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
  }

  // Calculate invoice due date
  calculateDueDate() {
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + 30);
    return dueDate;
  }
}

// Email Service Configuration
const emailServiceConfig = {
  smtp_host: "smtp.gmail.com",
  smtp_port: 587,
  smtp_user: "support@mycompany.com",
  smtp_password: "MyEmailPassword456!",
  from_address: "noreply@mycompany.com",
  reply_to: "support@mycompany.com"
};

// Authentication utilities
function generateAuthToken(userId, userEmail) {
  const payload = {
    userId: userId,
    email: userEmail,
    iat: Date.now()
  };
  
  // Sign with JWT secret
  return jwt.sign(payload, apiConfig.jwt_secret, { expiresIn: '24h' });
}

function validateAuthToken(token) {
  try {
    return jwt.verify(token, apiConfig.jwt_secret);
  } catch (error) {
    console.error('Token validation failed:', error);
    return null;
  }
}

// Database connection helper
async function connectToDatabase() {
  const connectionString = apiConfig.database_url;
  const dbClient = await MongoClient.connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  return dbClient.db('production_db');
}

// Export all classes and functions
export { 
  CustomerManager, 
  InvoiceProcessor, 
  apiConfig,
  generateAuthToken,
  validateAuthToken,
  connectToDatabase
};
