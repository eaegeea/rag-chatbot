# Oso Polar Policy for RAG Sales Chatbot
# This file shows an example policy structure that you would configure in Oso Cloud UI

# Define the main authorization rule for reading customer notes
allow(actor: User, "read", resource: CustomerNote) if
    can_read_customer_note(actor, resource);

# Salespeople can read customer notes for their assigned customers
can_read_customer_note(user: User, note: CustomerNote) if
    user.role = "salesperson" and
    note.customer.salesperson = user;

# Sales managers can read all customer notes in their region
can_read_customer_note(user: User, note: CustomerNote) if
    user.role = "sales_manager" and
    note.customer.region = user.region;

# Define entities and their relationships
# These would be loaded as facts in Oso Cloud

# User entity
resource User {
    permissions = ["read"];
    relations = {
        "region": Region,
        "assigned_customers": Customer
    };
    
    roles = ["salesperson", "sales_manager"];
}

# CustomerNote entity  
resource CustomerNote {
    permissions = ["read"];
    relations = {
        "customer": Customer
    };
}

# Customer entity
resource Customer {
    permissions = ["read"];
    relations = {
        "region": Region,
        "salesperson": User
    };
}

# Region entity
resource Region {
    permissions = ["read"];
}

# Additional rules for blocks (vector embeddings)
allow(actor: User, "read", resource: Block) if
    allow(actor, "read", resource.customer_note);

resource Block {
    permissions = ["read"];
    relations = {
        "customer_note": CustomerNote
    };
}

# Example facts that would be loaded into Oso Cloud:
# (These are examples - you would load actual data through the API or UI)

# Regions
# has_relation(Region:"East", "name", "East");
# has_relation(Region:"West", "name", "West");

# Users
# has_relation(User:"alice@company.com", "region", Region:"East");
# has_relation(User:"alice@company.com", "role", "salesperson");
# has_relation(User:"bob@company.com", "region", Region:"East");
# has_relation(User:"bob@company.com", "role", "salesperson");
# has_relation(User:"carol@company.com", "region", Region:"East");
# has_relation(User:"carol@company.com", "role", "sales_manager");

# Customers
# has_relation(Customer:"1", "region", Region:"East");
# has_relation(Customer:"1", "salesperson", User:"alice@company.com");
# has_relation(Customer:"2", "region", Region:"East");
# has_relation(Customer:"2", "salesperson", User:"alice@company.com");

# Customer Notes
# has_relation(CustomerNote:"1", "customer", Customer:"1");
# has_relation(CustomerNote:"2", "customer", Customer:"1");

# Blocks
# has_relation(Block:"1", "customer_note", CustomerNote:"1");
# has_relation(Block:"2", "customer_note", CustomerNote:"1"); 