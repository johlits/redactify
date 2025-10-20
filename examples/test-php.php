<?php
// PHP Example Code for Testing Redaction

namespace App\Services;

use App\Models\Customer;
use App\Models\Order;
use Exception;

/**
 * Customer Service Class
 */
class CustomerService
{
    private $databaseConnection;
    private $paymentProcessor;
    private $customerCache = [];

    public function __construct($db, $gateway)
    {
        $this->databaseConnection = $db;
        $this->paymentProcessor = $gateway;
        $this->customerCache = [];
    }

    /**
     * Create a new customer
     */
    public function createCustomer($customerName, $customerEmail, $customerPhone)
    {
        $customerId = $this->generateCustomerId();
        $customer = [
            'id' => $customerId,
            'name' => $customerName,
            'email' => $customerEmail,
            'phone' => $customerPhone,
            'company_name' => 'Acme Corporation',
            'subscription_tier' => 'Premium'
        ];

        $this->databaseConnection->insert('customers', $customer);
        $this->customerCache[$customerId] = $customer;
        return $customer;
    }

    /**
     * Process payment for customer
     */
    public function processPayment($customerId, $paymentAmount)
    {
        $customer = $this->getCustomerById($customerId);
        
        $paymentRequest = [
            'customer_id' => $customerId,
            'amount' => $paymentAmount,
            'currency' => 'USD',
            'description' => 'Monthly subscription payment'
        ];

        $result = $this->paymentProcessor->process($paymentRequest);
        return $result;
    }

    /**
     * Get customer by ID
     */
    public function getCustomerById($customerId)
    {
        if (isset($this->customerCache[$customerId])) {
            return $this->customerCache[$customerId];
        }
        
        $customer = $this->databaseConnection->findOne('customers', ['id' => $customerId]);
        $this->customerCache[$customerId] = $customer;
        return $customer;
    }

    /**
     * Generate unique customer ID
     */
    private function generateCustomerId()
    {
        return rand(1000, 9999);
    }

    /**
     * Get all active customers
     */
    public function getActiveCustomers()
    {
        $activeCustomers = array_filter($this->customerCache, function($customer) {
            return $customer['is_active'] === true;
        });
        
        return array_values($activeCustomers);
    }

    /**
     * Process multiple orders
     */
    public function processOrders($orderList)
    {
        foreach ($orderList as $order) {
            echo "Processing order {$order['id']}\n";
        }
    }

    /**
     * Calculate total revenue
     */
    public function calculateTotalRevenue($orders)
    {
        $totalRevenue = array_reduce($orders, function($sum, $order) {
            return $sum + $order['amount'];
        }, 0);
        
        return $totalRevenue;
    }

    /**
     * Handle exceptions
     */
    public function tryProcessOrder($order)
    {
        try {
            $result = $this->processOrderInternal($order);
            return $result;
        } catch (Exception $ex) {
            echo "Error processing order: {$ex->getMessage()}\n";
            return false;
        }
    }

    /**
     * Process orders with key-value pairs
     */
    public function processOrdersByStatus($ordersByStatus)
    {
        foreach ($ordersByStatus as $status => $orders) {
            echo "Processing {$status} orders\n";
            foreach ($orders as $order) {
                $this->processOrderInternal($order);
            }
        }
    }

    /**
     * Filter customers using arrow function (PHP 7.4+)
     */
    public function filterCustomersByTier($customers, $tier)
    {
        return array_filter($customers, fn($customer) => $customer['tier'] === $tier);
    }

    /**
     * Map customer names
     */
    public function getCustomerNames($customers)
    {
        return array_map(fn($customer) => $customer['name'], $customers);
    }

    private function processOrderInternal($order)
    {
        sleep(1);
        return true;
    }
}

// Standalone functions
function formatCustomerName($firstName, $lastName)
{
    return "{$firstName} {$lastName}";
}

function calculateDiscount($originalPrice, $discountPercent)
{
    $discountAmount = $originalPrice * ($discountPercent / 100);
    return $originalPrice - $discountAmount;
}

// API Configuration
$apiConfig = [
    'api_key' => 'sk_live_EXAMPLE_KEY_1234567890',
    'secret_key' => 'whsec_EXAMPLE_SECRET_abcdef',
    'base_url' => 'https://api.example.com/v1'
];

// Database connection
$dbConnection = new PDO('mysql:host=localhost;dbname=myapp', 'username', 'password123');

?>
