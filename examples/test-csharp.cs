// C# Example Code for Testing Redaction
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CustomerManagement
{
    // Customer class
    public class CustomerService
    {
        private readonly IDatabase databaseConnection;
        private readonly IPaymentGateway paymentProcessor;
        private Dictionary<int, Customer> customerCache;

        public CustomerService(IDatabase db, IPaymentGateway gateway)
        {
            databaseConnection = db;
            paymentProcessor = gateway;
            customerCache = new Dictionary<int, Customer>();
        }

        // Create a new customer
        public async Task<Customer> CreateCustomer(string customerName, string customerEmail, string customerPhone)
        {
            var customerId = GenerateCustomerId();
            var customer = new Customer
            {
                Id = customerId,
                Name = customerName,
                Email = customerEmail,
                Phone = customerPhone,
                CompanyName = "Acme Corporation",
                SubscriptionTier = "Premium"
            };

            await databaseConnection.InsertAsync("customers", customer);
            customerCache[customerId] = customer;
            return customer;
        }

        // Process payment for customer
        public async Task<PaymentResult> ProcessPayment(int customerId, decimal paymentAmount)
        {
            var customer = await GetCustomerById(customerId);
            
            var paymentRequest = new PaymentRequest
            {
                CustomerId = customerId,
                Amount = paymentAmount,
                Currency = "USD",
                Description = "Monthly subscription payment"
            };

            var result = await paymentProcessor.ProcessAsync(paymentRequest);
            return result;
        }

        // Get customer by ID
        public async Task<Customer> GetCustomerById(int customerId)
        {
            if (customerCache.ContainsKey(customerId))
            {
                return customerCache[customerId];
            }
            
            var customer = await databaseConnection.FindOneAsync<Customer>(c => c.Id == customerId);
            customerCache[customerId] = customer;
            return customer;
        }

        // Generate unique customer ID
        private int GenerateCustomerId()
        {
            return new Random().Next(1000, 9999);
        }

        // Get all active customers
        public List<Customer> GetActiveCustomers()
        {
            var activeCustomers = customerCache.Values
                .Where(customer => customer.IsActive)
                .OrderBy(customer => customer.Name)
                .ToList();
            
            return activeCustomers;
        }

        // Process bulk orders
        public void ProcessOrders(params Order[] orderList)
        {
            foreach (var order in orderList)
            {
                Console.WriteLine($"Processing order {order.Id}");
            }
        }

        // Calculate total revenue
        public decimal CalculateTotalRevenue(List<Order> orders)
        {
            var totalRevenue = orders.Aggregate(0m, (sum, order) => sum + order.Amount);
            return totalRevenue;
        }

        // Handle exceptions
        public async Task<bool> TryProcessOrder(Order order)
        {
            try
            {
                var result = await ProcessOrderInternal(order);
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error processing order: {ex.Message}");
                return false;
            }
        }

        // Using statement example
        public async Task<string> ReadCustomerData(string filePath)
        {
            using (var fileStream = File.OpenRead(filePath))
            using (var reader = new StreamReader(fileStream))
            {
                var content = await reader.ReadToEndAsync();
                return content;
            }
        }

        private async Task<bool> ProcessOrderInternal(Order order)
        {
            await Task.Delay(100);
            return true;
        }
    }

    // Customer model
    public class Customer
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string CompanyName { get; set; }
        public string SubscriptionTier { get; set; }
        public bool IsActive { get; set; }
    }

    // Order model
    public class Order
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public decimal Amount { get; set; }
        public DateTime OrderDate { get; set; }
    }
}
