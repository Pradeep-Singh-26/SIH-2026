import os
import json
import uuid
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional
import pymongo
from pymongo.errors import PyMongoError

logger = logging.getLogger("dam_breach.db")

# Read MongoDB Atlas URI from environment or config
MONGODB_URI = os.getenv("MONGODB_URI", "")
DB_NAME = os.getenv("MONGODB_DB_NAME", "dam_flood_simulation")

LOCAL_STORE_DIR = Path(__file__).resolve().parent.parent / "data" / "local_db"
LOCAL_STORE_DIR.mkdir(parents=True, exist_ok=True)
LOCAL_USERS_FILE = LOCAL_STORE_DIR / "users.json"
LOCAL_SIMS_FILE = LOCAL_STORE_DIR / "simulations.json"

class DatabaseManager:
    """
    MongoDB Atlas Client with resilient fallback to local JSON file storage.
    Ensures seamless functionality whether Atlas is configured, offline, or local.
    """
    def __init__(self):
        self.client: Optional[pymongo.MongoClient] = None
        self.db = None
        self.is_atlas: bool = False
        self.status_message: str = "Uninitialized"
        self._init_connection()

    def _init_connection(self):
        if MONGODB_URI and MONGODB_URI.strip():
            try:
                # 4-second timeout to quickly detect Atlas connectivity
                self.client = pymongo.MongoClient(
                    MONGODB_URI,
                    serverSelectionTimeoutMS=4000,
                    connectTimeoutMS=4000
                )
                # Heartbeat ping
                self.client.admin.command('ping')
                self.db = self.client[DB_NAME]
                self.is_atlas = True
                self.status_message = "Connected to MongoDB Atlas"
                
                # Ensure unique index on email
                self.db.users.create_index("email", unique=True)
                self.db.simulations.create_index("id", unique=True)
                self.db.simulations.create_index("user_id")
                logger.info(f"[DB] MongoDB Atlas connection verified. Database: {DB_NAME}")
                return
            except Exception as e:
                logger.warning(f"[DB] Could not connect to MongoDB Atlas ({e}). Falling back to resilient local storage.")
                self.client = None
                self.db = None
                self.is_atlas = False
                self.status_message = f"Local Mode (Atlas error: {str(e)[:45]}...)"
        else:
            self.is_atlas = False
            self.status_message = "Local Mode (Set MONGODB_URI in backend/.env to connect Atlas)"
            logger.info("[DB] Running in resilient local storage mode.")

    def get_status(self) -> Dict[str, Any]:
        return {
            "is_atlas": self.is_atlas,
            "status": self.status_message,
            "database_name": DB_NAME if self.is_atlas else "local_json_db",
            "atlas_uri_configured": bool(MONGODB_URI)
        }

    # --- Local fallback helpers ---
    def _read_local_json(self, filepath: Path) -> List[Dict[str, Any]]:
        if not filepath.exists():
            return []
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _write_local_json(self, filepath: Path, data: List[Dict[str, Any]]):
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)

    # --- User operations ---
    def find_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        norm_email = email.lower().strip()
        if self.is_atlas and self.db is not None:
            try:
                user = self.db.users.find_one({"email": norm_email})
                if user:
                    user["_id"] = str(user["_id"])
                return user
            except PyMongoError as e:
                logger.error(f"[DB] Atlas find_user failed: {e}")

        # Local fallback
        users = self._read_local_json(LOCAL_USERS_FILE)
        for u in users:
            if u.get("email") == norm_email:
                return u
        return None

    def find_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        if self.is_atlas and self.db is not None:
            try:
                user = self.db.users.find_one({"id": user_id})
                if user:
                    user["_id"] = str(user["_id"])
                return user
            except PyMongoError as e:
                logger.error(f"[DB] Atlas find_user_by_id failed: {e}")

        users = self._read_local_json(LOCAL_USERS_FILE)
        for u in users:
            if u.get("id") == user_id:
                return u
        return None

    def create_user(self, user_doc: Dict[str, Any]) -> Dict[str, Any]:
        user_doc["email"] = user_doc["email"].lower().strip()
        if "id" not in user_doc:
            user_doc["id"] = f"usr_{uuid.uuid4().hex[:10]}"
        if "created_at" not in user_doc:
            user_doc["created_at"] = datetime.now(timezone.utc).isoformat()
        user_doc["last_login"] = datetime.now(timezone.utc).isoformat()

        if self.is_atlas and self.db is not None:
            try:
                res = self.db.users.insert_one(user_doc.copy())
                user_doc["_id"] = str(res.inserted_id)
                return user_doc
            except PyMongoError as e:
                logger.error(f"[DB] Atlas insert user error: {e}")

        users = self._read_local_json(LOCAL_USERS_FILE)
        for u in users:
            if u.get("email") == user_doc["email"]:
                raise ValueError("User with this email already exists")
        users.append(user_doc)
        self._write_local_json(LOCAL_USERS_FILE, users)
        return user_doc

    def update_user_last_login(self, user_id: str):
        now = datetime.now(timezone.utc).isoformat()
        if self.is_atlas and self.db is not None:
            try:
                self.db.users.update_one({"id": user_id}, {"$set": {"last_login": now}})
                return
            except PyMongoError:
                pass

        users = self._read_local_json(LOCAL_USERS_FILE)
        for u in users:
            if u.get("id") == user_id:
                u["last_login"] = now
                break
        self._write_local_json(LOCAL_USERS_FILE, users)

    # --- Simulation operations ---
    def save_simulation(self, sim_doc: Dict[str, Any]) -> Dict[str, Any]:
        if "created_at" not in sim_doc:
            sim_doc["created_at"] = datetime.now(timezone.utc).isoformat()

        if self.is_atlas and self.db is not None:
            try:
                self.db.simulations.update_one(
                    {"id": sim_doc["id"]},
                    {"$set": sim_doc},
                    upsert=True
                )
                return sim_doc
            except PyMongoError as e:
                logger.error(f"[DB] Atlas save_simulation error: {e}")

        sims = self._read_local_json(LOCAL_SIMS_FILE)
        existing_idx = next((i for i, s in enumerate(sims) if s.get("id") == sim_doc["id"]), None)
        if existing_idx is not None:
            sims[existing_idx] = sim_doc
        else:
            sims.append(sim_doc)
        self._write_local_json(LOCAL_SIMS_FILE, sims)
        return sim_doc

    def get_simulations_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        if self.is_atlas and self.db is not None:
            try:
                cursor = self.db.simulations.find({"user_id": user_id}).sort("created_at", -1).limit(50)
                results = []
                for doc in cursor:
                    doc["_id"] = str(doc.get("_id", ""))
                    results.append(doc)
                return results
            except PyMongoError as e:
                logger.error(f"[DB] Atlas get_simulations error: {e}")

        sims = self._read_local_json(LOCAL_SIMS_FILE)
        user_sims = [s for s in sims if s.get("user_id") == user_id]
        user_sims.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return user_sims

# Global singleton instance
db_manager = DatabaseManager()
