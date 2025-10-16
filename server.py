from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
import psycopg2
import json
from psycopg2.extras import RealDictCursor

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SaveUserDataRequest(BaseModel):
    email: str
    json_data: dict


# PostgreSQL helper
def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=os.getenv("DB_PORT", 5432),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASS"),
            cursor_factory=RealDictCursor
        )
        return conn
    except Exception as e:
        print("DB Connection error:", e)
        return None


# New endpoint
@app.post("/save-user-data")
async def save_user_data(request: SaveUserDataRequest):
    email = request.email
    json_data = request.json_data

    conn = get_db_connection()
    if not conn:
        return {
            "status": "error",
            "message": "Cannot connect to database. Check your DB credentials.",
        }

    try:
        cur = conn.cursor()

        # Check if user already exists
        cur.execute("SELECT user_id FROM i140users WHERE email = %s", (email,))
        user = cur.fetchone()

        if user:
            # Existing user — add new JSON record
            user_id = user["user_id"]
            cur.execute(
                """
                INSERT INTO i140users_data (user_id, json3_process)
                VALUES (%s, %s)
                RETURNING data_id
                """,
                (user_id, json.dumps(json_data)),  # serialize JSON
            )
            data_id = cur.fetchone()["data_id"]
            msg = f"Existing user found. Data added for user_id {user_id}, data_id {data_id}."
        else:
            # New user — create them first
            cur.execute(
                """
                INSERT INTO i140users (email, role, credit_remaining)
                VALUES (%s, %s, %s)
                RETURNING user_id
                """,
                (email, "user", 0),
            )
            new_user_id = cur.fetchone()["user_id"]

            cur.execute(
                """
                INSERT INTO i140users_data (user_id, json3_process)
                VALUES (%s, %s)
                RETURNING data_id
                """,
                (new_user_id, json.dumps(json_data)),  # serialize JSON
            )
            data_id = cur.fetchone()["data_id"]
            msg = f"New user created with user_id {new_user_id}, data_id {data_id}."

        conn.commit()

        return {"status": "success", "message": msg, "data_id": data_id}

    except Exception as e:
        if conn:
            conn.rollback()
        return {"status": "error", "message": str(e)}

    finally:
        if conn:
            conn.close()
            
            
# Fetch json3_process model
class GetUserDataRequest(BaseModel):
    rB: int  # this is your data_id

@app.post("/get-user-data")
async def get_user_data(request: GetUserDataRequest):
    rB = request.rB

    conn = get_db_connection()
    if not conn:
        return {
            "status": "error",
            "message": "Cannot connect to database. Check your DB credentials.",
        }

    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT json3_process
            FROM i140users_data
            WHERE data_id = %s
            """,
            (rB,),
        )

        row = cur.fetchone()
        if not row:
            return {
                "status": "error",
                "message": f"No record found for data_id {rB}.",
            }

        # Return the JSON column data
        return {
            "status": "success",
            "data_id": rB,
            "json_data": row["json3_process"],  # should already be JSON
        }

    except Exception as e:
        if conn:
            conn.rollback()
        return {
            "status": "error",
            "message": str(e),
        }

    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
