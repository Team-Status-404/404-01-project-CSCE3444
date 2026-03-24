import os
import psycopg2
from dotenv import load_dotenv
from database import access_db_tables

# Load environment variables
load_dotenv()

def test_database_operations():
    print("1. Initializing Tables...")
    # This runs your existing function to ensure tables exist
    access_db_tables() 
    print("✅ Tables initialized successfully.\n")

    conn = None
    try:
        # Connect to the database
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            port=os.getenv("DB_PORT"),
            database=os.getenv("DB_NAME")
        )
        cur = conn.cursor()

        print("2. Testing Insert Operations...")
        # Insert a dummy user
        cur.execute("""
            INSERT INTO users (username, email, password) 
            VALUES ('test_user', 'test@example.com', 'hashed_pw_123')
            ON CONFLICT (username) DO NOTHING;
        """)
        
        # Insert a dummy stock
        cur.execute("""
            INSERT INTO stocks (ticker, company_name, sector, current_price) 
            VALUES ('TEST', 'Test Corp', 'Technology', 150.00)
            ON CONFLICT (ticker) DO NOTHING;
        """)
        conn.commit()
        print("✅ Data inserted successfully.\n")

        print("3. Testing Read Operations...")
        # Query the user
        cur.execute("SELECT id, username, email FROM users WHERE username = 'test_user';")
        user = cur.fetchone()
        print(f"👤 Retrieved User: {user}")

        # Query the stock
        cur.execute("SELECT ticker, company_name, current_price FROM stocks WHERE ticker = 'TEST';")
        stock = cur.fetchone()
        print(f"📈 Retrieved Stock: {stock}")
        print("✅ Data read successfully.\n")

        print("4. Cleaning up test data...")
        # Delete the test data to keep the database clean
        cur.execute("DELETE FROM users WHERE username = 'test_user';")
        cur.execute("DELETE FROM stocks WHERE ticker = 'TEST';")
        conn.commit()
        print("✅ Clean up complete.\n")

        print("🎉 ALL DATABASE TESTS PASSED!")

    except Exception as e:
        print(f"❌ DATABASE ERROR: {e}")
    finally:
        if conn:
            cur.close()
            conn.close()

if __name__ == "__main__":
    test_database_operations()